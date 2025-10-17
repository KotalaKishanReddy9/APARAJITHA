import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { db } from "./db";
import { and, eq, inArray } from "drizzle-orm";
import { 
  users, courses, enrollments, assignments, submissions, 
  grades, discussions, materials, notifications,
  insertUserSchema, insertCourseSchema, insertAssignmentSchema,
  insertSubmissionSchema, insertGradeSchema, insertDiscussionSchema,
  insertMaterialSchema
} from "@shared/schema";
import { z } from "zod";

const clients = new Map<string, WebSocket>();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(7, "Password must be at least 7 characters"),
});

const enrollmentSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
});

const gradeSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  grade: z.number().int().min(0).max(100),
  feedback: z.string().optional(),
});

// Extend session to include user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireRole(role: 'teacher' | 'student') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || req.session.userRole !== role) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

function broadcastNotification(userId: string, notification: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: "notification", data: notification }));
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration with Memory store for demo
  const memoryStore = MemoryStore(session);
  
  app.use(
    session({
      store: new memoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "demo-secret-key",
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset expiry on activity
      cookie: {
        secure: false, // Allow HTTP for demo
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 day for demo
        sameSite: 'lax',
      },
    })
  );

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate input
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      // Validate input
      const { email, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Course routes
  app.get("/api/courses", requireAuth, async (req, res) => {
    try {
      // Use JOIN to get courses with teachers in a single query
      const coursesWithTeachers = await db
        .select({
          id: courses.id,
          title: courses.title,
          description: courses.description,
          duration: courses.duration,
          teacherId: courses.teacherId,
          createdAt: courses.createdAt,
          teacher: {
            name: users.name
          }
        })
        .from(courses)
        .leftJoin(users, eq(courses.teacherId, users.id));
      
      res.json(coursesWithTeachers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:id", requireAuth, async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Verify user has access to this course (teacher or enrolled student)
      const isTeacher = req.session.userRole === 'teacher' && course.teacherId === req.session.userId;
      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, req.params.id),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      const isEnrolled = req.session.userRole === 'student' && enrollmentCheck.length > 0;

      if (!isTeacher && !isEnrolled) {
        return res.status(403).json({ message: "You don't have access to this course" });
      }

      const teacher = await storage.getUser(course.teacherId);
      res.json({ ...course, teacher: { name: teacher?.name || "Unknown" } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/logout", requireAuth, (req, res) => {
    const userId = req.session.userId;
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Clean up WebSocket connection
      if (userId && clients.has(userId)) {
        const client = clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.close();
        }
        clients.delete(userId);
      }
      
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/courses", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      // Validate input
      const validatedData = insertCourseSchema.parse(req.body);
      
      const course = await storage.createCourse({
        ...validatedData,
        teacherId: req.session.userId!,
      });
      res.json(course);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/courses", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.userId!;
      const allCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.teacherId, teacherId));
      res.json(allCourses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enrollment routes
  app.post("/api/enrollments", requireAuth, requireRole('student'), async (req, res) => {
    try {
      // Validate input
      const { courseId } = enrollmentSchema.parse(req.body);
      
      // Check if course exists
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if already enrolled
      const existingEnrollments = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, courseId),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      
      if (existingEnrollments.length > 0) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      const enrollment = await storage.createEnrollment({
        courseId,
        studentId: req.session.userId!,
      });
      
      const notification = await storage.createNotification({
        userId: req.session.userId!,
        type: "Enrollment",
        content: `You've been enrolled in ${course.title}`,
        isRead: false,
      });
      broadcastNotification(req.session.userId!, notification);

      res.json(enrollment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/student/enrollments", requireAuth, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.session.userId!;
      
      // Use JOIN to get enrollments with course and teacher data in a single query
      const enrollmentsWithCourses = await db
        .select({
          id: enrollments.id,
          studentId: enrollments.studentId,
          courseId: enrollments.courseId,
          enrolledAt: enrollments.enrolledAt,
          course: {
            id: courses.id,
            title: courses.title,
            description: courses.description,
            duration: courses.duration,
            teacherId: courses.teacherId,
            createdAt: courses.createdAt,
            teacher: {
              name: users.name
            }
          }
        })
        .from(enrollments)
        .leftJoin(courses, eq(enrollments.courseId, courses.id))
        .leftJoin(users, eq(courses.teacherId, users.id))
        .where(eq(enrollments.studentId, studentId));

      res.json(enrollmentsWithCourses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:id/enrollments", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      // Verify the teacher owns this course
      const course = await storage.getCourse(req.params.id);
      if (!course || course.teacherId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to view these enrollments" });
      }
      
      const courseEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.courseId, req.params.id));

      const enrollmentsWithStudents = await Promise.all(
        courseEnrollments.map(async (enrollment: any) => {
          const [student] = await db
            .select()
            .from(users)
            .where(eq(users.id, enrollment.studentId));
          return { ...enrollment, student: { name: student.name, email: student.email } };
        })
      );

      res.json(enrollmentsWithStudents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/students", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.userId!;
      const teacherCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.teacherId, teacherId));

      const courseIds = teacherCourses.map((c: any) => c.id);
      if (courseIds.length === 0) {
        return res.json([]);
      }

      const allEnrollments = await db
        .select()
        .from(enrollments)
        .where(inArray(enrollments.courseId, courseIds));

      const enrollmentsWithDetails = await Promise.all(
        allEnrollments.map(async (enrollment: any) => {
          const [student] = await db
            .select()
            .from(users)
            .where(eq(users.id, enrollment.studentId));
          
          const [course] = await db
            .select()
            .from(courses)
            .where(eq(courses.id, enrollment.courseId));

          return {
            student: { id: student.id, name: student.name, email: student.email },
            course: { title: course.title },
          };
        })
      );

      res.json(enrollmentsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Assignment routes
  app.post("/api/assignments", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      // Verify the teacher owns this course
      const course = await storage.getCourse(req.body.courseId);
      if (!course || course.teacherId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to create assignments for this course" });
      }
      
      const assignment = await storage.createAssignment(req.body);
      
      const courseEnrollments = await storage.getEnrollmentsByCourse(req.body.courseId);
      
      for (const enrollment of courseEnrollments) {
        const notification = await storage.createNotification({
          userId: enrollment.studentId,
          type: "Assignment",
          content: `New assignment in ${course?.title}: ${assignment.title}`,
          isRead: false,
        });
        broadcastNotification(enrollment.studentId, notification);
      }

      res.json(assignment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/assignments/:id", requireAuth, async (req, res) => {
    try {
      const [assignment] = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, req.params.id));

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, assignment.courseId));

      // Verify user has access to this assignment
      const isTeacher = req.session.userRole === 'teacher' && course.teacherId === req.session.userId;
      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, assignment.courseId),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      const isEnrolled = req.session.userRole === 'student' && enrollmentCheck.length > 0;

      if (!isTeacher && !isEnrolled) {
        return res.status(403).json({ message: "You don't have access to this assignment" });
      }

      // If student, only return their own submission
      let assignmentSubmissions;
      if (isEnrolled && !isTeacher) {
        assignmentSubmissions = await db
          .select()
          .from(submissions)
          .where(and(
            eq(submissions.assignmentId, assignment.id),
            eq(submissions.studentId, req.session.userId!)
          ));
      } else {
        // Teacher gets all submissions
        assignmentSubmissions = await db
          .select()
          .from(submissions)
          .where(eq(submissions.assignmentId, assignment.id));
      }

      const submissionsWithGrades = await Promise.all(
        assignmentSubmissions.map(async (submission: any) => {
          const [student] = await db
            .select()
            .from(users)
            .where(eq(users.id, submission.studentId));

          const submissionGrades = await db
            .select()
            .from(grades)
            .where(eq(grades.submissionId, submission.id));

          return {
            ...submission,
            student: { name: student.name, email: student.email },
            grades: submissionGrades,
          };
        })
      );

      res.json({
        ...assignment,
        course: { title: course.title },
        submissions: submissionsWithGrades,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:id/assignments", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this course
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const isTeacher = req.session.userRole === 'teacher' && course.teacherId === req.session.userId;
      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, req.params.id),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      const isEnrolled = req.session.userRole === 'student' && enrollmentCheck.length > 0;

      if (!isTeacher && !isEnrolled) {
        return res.status(403).json({ message: "You don't have access to this course" });
      }

      const courseAssignments = await db
        .select()
        .from(assignments)
        .where(eq(assignments.courseId, req.params.id));
      res.json(courseAssignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/student/assignments", requireAuth, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.session.userId!;
      
      const studentEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId));

      const courseIds = studentEnrollments.map((e: any) => e.courseId);
      if (courseIds.length === 0) {
        return res.json([]);
      }

      const allAssignments = await db
        .select()
        .from(assignments)
        .where(inArray(assignments.courseId, courseIds));

      const assignmentsWithDetails = await Promise.all(
        allAssignments.map(async (assignment: any) => {
          const [course] = await db
            .select()
            .from(courses)
            .where(eq(courses.id, assignment.courseId));

          const assignmentSubmissions = await db
            .select()
            .from(submissions)
            .where(
              and(
                eq(submissions.assignmentId, assignment.id),
                eq(submissions.studentId, studentId)
              )
            );

          return {
            ...assignment,
            course: { title: course.title },
            submissions: assignmentSubmissions,
          };
        })
      );

      res.json(assignmentsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/student/assignments/pending", requireAuth, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.session.userId!;
      
      const studentEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.studentId, studentId));

      const courseIds = studentEnrollments.map((e: any) => e.courseId);
      if (courseIds.length === 0) {
        return res.json([]);
      }

      const allAssignments = await db
        .select()
        .from(assignments)
        .where(inArray(assignments.courseId, courseIds));

      const pendingAssignments = [];
      for (const assignment of allAssignments) {
        const [submission] = await db
          .select()
          .from(submissions)
          .where(
            and(
              eq(submissions.assignmentId, assignment.id),
              eq(submissions.studentId, studentId)
            )
          );

        if (!submission) {
          pendingAssignments.push(assignment);
        }
      }

      res.json(pendingAssignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/assignments", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.userId!;
      const teacherCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.teacherId, teacherId));

      const courseIds = teacherCourses.map((c: any) => c.id);
      if (courseIds.length === 0) {
        return res.json([]);
      }

      const allAssignments = await db
        .select()
        .from(assignments)
        .where(inArray(assignments.courseId, courseIds));

      const assignmentsWithDetails = await Promise.all(
        allAssignments.map(async (assignment) => {
          const [course] = await db
            .select()
            .from(courses)
            .where(eq(courses.id, assignment.courseId));

          const submissionCount = await db
            .select()
            .from(submissions)
            .where(eq(submissions.assignmentId, assignment.id));

          return {
            ...assignment,
            course: { title: course.title },
            _count: { submissions: submissionCount.length },
          };
        })
      );

      res.json(assignmentsWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Submission routes
  app.post("/api/submissions", requireAuth, requireRole('student'), async (req, res) => {
    try {
      // Verify student is enrolled in the course for this assignment
      const assignment = await storage.getAssignment(req.body.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, assignment.courseId),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);

      if (enrollmentCheck.length === 0) {
        return res.status(403).json({ message: "You are not enrolled in this course" });
      }

      const submission = await storage.createSubmission({
        assignmentId: req.body.assignmentId,
        studentId: req.session.userId!,
        content: req.body.content,
        fileUrl: req.body.fileUrl,
      });
      
      if (assignment) {
        const course = await storage.getCourse(assignment.courseId);
        const notification = await storage.createNotification({
          userId: course!.teacherId,
          type: "Submission",
          content: `New submission for ${assignment.title}`,
          isRead: false,
        });
        broadcastNotification(course!.teacherId, notification);
      }

      res.json(submission);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Grade routes
  app.post("/api/grades", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      // Validate input
      const validatedData = gradeSchema.parse(req.body);
      
      // Verify the teacher owns the course for this submission
      const submission = await storage.getSubmission(validatedData.submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const course = await storage.getCourse(assignment.courseId);
      if (!course || course.teacherId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to grade this submission" });
      }
      
      // Check if already graded
      const existingGrades = await db
        .select()
        .from(grades)
        .where(eq(grades.submissionId, validatedData.submissionId))
        .limit(1);
      
      if (existingGrades.length > 0) {
        return res.status(400).json({ message: "This submission has already been graded" });
      }
      
      const grade = await storage.createGrade(validatedData);
      
      const notification = await storage.createNotification({
        userId: submission.studentId,
        type: "Grade",
        content: `Your assignment "${assignment.title}" has been graded: ${grade.grade}/100`,
        isRead: false,
      });
      broadcastNotification(submission.studentId, notification);

      res.json(grade);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/student/grades", requireAuth, requireRole('student'), async (req, res) => {
    try {
      const studentId = req.session.userId!;
      
      const studentSubmissions = await db
        .select()
        .from(submissions)
        .where(eq(submissions.studentId, studentId));

      const submissionIds = studentSubmissions.map((s: any) => s.id);
      if (submissionIds.length === 0) {
        return res.json([]);
      }

      const allGrades = await db
        .select()
        .from(grades)
        .where(inArray(grades.submissionId, submissionIds));

      const gradesWithDetails = await Promise.all(
        allGrades.map(async (grade: any) => {
          const [submission] = await db
            .select()
            .from(submissions)
            .where(eq(submissions.id, grade.submissionId));

          const [assignment] = await db
            .select()
            .from(assignments)
            .where(eq(assignments.id, submission.assignmentId));

          const [course] = await db
            .select()
            .from(courses)
            .where(eq(courses.id, assignment.courseId));

          return {
            ...grade,
            submission: {
              ...submission,
              assignment: {
                ...assignment,
                course: { title: course.title },
              },
            },
          };
        })
      );

      res.json(gradesWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/grades", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      const teacherId = req.session.userId!;
      const teacherCourses = await db
        .select()
        .from(courses)
        .where(eq(courses.teacherId, teacherId));

      const courseIds = teacherCourses.map((c) => c.id);
      if (courseIds.length === 0) {
        return res.json([]);
      }

      const allAssignments = await db
        .select()
        .from(assignments)
        .where(inArray(assignments.courseId, courseIds));

      const assignmentIds = allAssignments.map((a: any) => a.id);
      if (assignmentIds.length === 0) {
        return res.json([]);
      }

      const allSubmissions = await db
        .select()
        .from(submissions)
        .where(inArray(submissions.assignmentId, assignmentIds));

      const submissionIds = allSubmissions.map((s: any) => s.id);
      if (submissionIds.length === 0) {
        return res.json([]);
      }

      const allGrades = await db
        .select()
        .from(grades)
        .where(inArray(grades.submissionId, submissionIds));

      const gradesWithDetails = await Promise.all(
        allGrades.map(async (grade: any) => {
          const [submission] = await db
            .select()
            .from(submissions)
            .where(eq(submissions.id, grade.submissionId));

          const [student] = await db
            .select()
            .from(users)
            .where(eq(users.id, submission.studentId));

          const [assignment] = await db
            .select()
            .from(assignments)
            .where(eq(assignments.id, submission.assignmentId));

          const [course] = await db
            .select()
            .from(courses)
            .where(eq(courses.id, assignment.courseId));

          return {
            ...grade,
            submission: {
              ...submission,
              student: { name: student.name },
              assignment: {
                ...assignment,
                course: { title: course.title },
              },
            },
          };
        })
      );

      res.json(gradesWithDetails);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Discussion routes
  app.get("/api/courses/:id/discussions", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this course
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const isTeacher = req.session.userRole === 'teacher' && course.teacherId === req.session.userId;
      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, req.params.id),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      const isEnrolled = req.session.userRole === 'student' && enrollmentCheck.length > 0;

      if (!isTeacher && !isEnrolled) {
        return res.status(403).json({ message: "You don't have access to this course" });
      }

      const courseDiscussions = await db
        .select()
        .from(discussions)
        .where(eq(discussions.courseId, req.params.id));

      const discussionsWithUsers = await Promise.all(
        courseDiscussions.map(async (discussion: any) => {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, discussion.userId));
          return { ...discussion, user: { name: user.name } };
        })
      );

      res.json(discussionsWithUsers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/discussions", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this course
      const course = await storage.getCourse(req.body.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const isTeacher = req.session.userRole === 'teacher' && course.teacherId === req.session.userId;
      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, req.body.courseId),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      const isEnrolled = req.session.userRole === 'student' && enrollmentCheck.length > 0;

      if (!isTeacher && !isEnrolled) {
        return res.status(403).json({ message: "You don't have access to this course" });
      }

      const discussion = await storage.createDiscussion({
        courseId: req.body.courseId,
        userId: req.session.userId!,
        content: req.body.content,
        parentId: req.body.parentId,
      });
      res.json(discussion);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Material routes
  app.get("/api/courses/:id/materials", requireAuth, async (req, res) => {
    try {
      // Verify user has access to this course
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const isTeacher = req.session.userRole === 'teacher' && course.teacherId === req.session.userId;
      const enrollmentCheck = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.courseId, req.params.id),
          eq(enrollments.studentId, req.session.userId!)
        ))
        .limit(1);
      const isEnrolled = req.session.userRole === 'student' && enrollmentCheck.length > 0;

      if (!isTeacher && !isEnrolled) {
        return res.status(403).json({ message: "You don't have access to this course" });
      }

      const courseMaterials = await storage.getMaterialsByCourse(req.params.id);
      res.json(courseMaterials);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/materials", requireAuth, requireRole('teacher'), async (req, res) => {
    try {
      // Verify the teacher owns this course
      const course = await storage.getCourse(req.body.courseId);
      if (!course || course.teacherId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to add materials to this course" });
      }
      
      const material = await storage.createMaterial(req.body);
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userNotifications = await storage.getNotificationsByUser(userId);
      res.json(userNotifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      // Verify the notification belongs to the authenticated user
      const notification = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, req.params.id))
        .limit(1);
      
      if (!notification[0]) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification[0].userId !== req.session.userId) {
        return res.status(403).json({ message: "You don't have permission to modify this notification" });
      }
      
      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let userId: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'auth' && data.userId) {
          /* WEBSOCKET AUTHENTICATION LIMITATION:
           * 
           * CURRENT MVP IMPLEMENTATION:
           * - WebSocket accepts client-supplied userId without verification
           * - Suitable for demonstration but NOT production-ready
           * 
           * PRODUCTION REQUIREMENTS:
           * 1. During HTTP upgrade, parse session cookie from request headers
           * 2. Verify session with express-session store (req.sessionStore)
           * 3. Extract authenticated userId from verified session
           * 4. Only register WebSocket if session is valid
           * 5. Reject unauthenticated upgrade requests
           * 
           * IMPLEMENTATION NOTES:
           * - Use wss.on('connection', (ws, req) => {...}) to access upgrade request
           * - Parse cookies with cookie-parser or manually from req.headers.cookie
           * - Verify session signature matches express-session secret
           * - Bind ws.userId to session.userId for all subsequent messages
           */
          userId = data.userId;
          if (userId) {
            clients.set(userId, ws);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  return httpServer;
}
