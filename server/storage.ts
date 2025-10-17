import {
  users,
  courses,
  enrollments,
  assignments,
  submissions,
  grades,
  discussions,
  materials,
  notifications,
  type User,
  type InsertUser,
  type Course,
  type InsertCourse,
  type Enrollment,
  type InsertEnrollment,
  type Assignment,
  type InsertAssignment,
  type Submission,
  type InsertSubmission,
  type Grade,
  type InsertGrade,
  type Discussion,
  type InsertDiscussion,
  type Material,
  type InsertMaterial,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Courses
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Enrollments
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  getEnrollmentsByTeacher(teacherId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;

  // Assignments
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;

  // Submissions
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;

  // Grades
  getGrade(id: string): Promise<Grade | undefined>;
  getGradesByStudent(studentId: string): Promise<Grade[]>;
  getGradesByTeacher(teacherId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;

  // Discussions
  getDiscussionsByCourse(courseId: string): Promise<Discussion[]>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;

  // Materials
  getMaterialsByCourse(courseId: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;

  // Notifications
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Courses
  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  // Enrollments
  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  async getEnrollmentsByTeacher(teacherId: string): Promise<Enrollment[]> {
    const teacherCourses = await this.getCoursesByTeacher(teacherId);
    const courseIds = teacherCourses.map((c) => c.id);
    if (courseIds.length === 0) return [];
    
    return await db
      .select()
      .from(enrollments)
      .where(inArray(enrollments.courseId, courseIds));
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db.insert(enrollments).values(insertEnrollment).returning();
    return enrollment;
  }

  // Assignments
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment || undefined;
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.courseId, courseId));
  }

  async getAssignmentsByTeacher(teacherId: string): Promise<Assignment[]> {
    const teacherCourses = await this.getCoursesByTeacher(teacherId);
    const courseIds = teacherCourses.map((c) => c.id);
    if (courseIds.length === 0) return [];

    return await db
      .select()
      .from(assignments)
      .where(inArray(assignments.courseId, courseIds));
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db.insert(assignments).values(insertAssignment).returning();
    return assignment;
  }

  // Submissions
  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission || undefined;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db.select().from(submissions).where(eq(submissions.studentId, studentId));
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db.insert(submissions).values(insertSubmission).returning();
    return submission;
  }

  // Grades
  async getGrade(id: string): Promise<Grade | undefined> {
    const [grade] = await db.select().from(grades).where(eq(grades.id, id));
    return grade || undefined;
  }

  async getGradesByStudent(studentId: string): Promise<Grade[]> {
    const studentSubmissions = await this.getSubmissionsByStudent(studentId);
    const submissionIds = studentSubmissions.map((s: any) => s.id);
    if (submissionIds.length === 0) return [];

    return await db
      .select()
      .from(grades)
      .where(inArray(grades.submissionId, submissionIds));
  }

  async getGradesByTeacher(teacherId: string): Promise<Grade[]> {
    const teacherAssignments = await this.getAssignmentsByTeacher(teacherId);
    if (teacherAssignments.length === 0) return [];

    const assignmentIds = teacherAssignments.map((a) => a.id);
    const allSubmissions = await db
      .select()
      .from(submissions)
      .where(inArray(submissions.assignmentId, assignmentIds));

    if (allSubmissions.length === 0) return [];

    const submissionIds = allSubmissions.map((s) => s.id);
    return await db
      .select()
      .from(grades)
      .where(inArray(grades.submissionId, submissionIds));
  }

  async createGrade(insertGrade: InsertGrade): Promise<Grade> {
    const [grade] = await db.insert(grades).values(insertGrade).returning();
    return grade;
  }

  // Discussions
  async getDiscussionsByCourse(courseId: string): Promise<Discussion[]> {
    return await db
      .select()
      .from(discussions)
      .where(eq(discussions.courseId, courseId))
      .orderBy(desc(discussions.createdAt));
  }

  async createDiscussion(insertDiscussion: InsertDiscussion): Promise<Discussion> {
    const [discussion] = await db.insert(discussions).values(insertDiscussion).returning();
    return discussion;
  }

  // Materials
  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.courseId, courseId));
  }

  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db.insert(materials).values(insertMaterial).returning();
    return material;
  }

  // Notifications
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
