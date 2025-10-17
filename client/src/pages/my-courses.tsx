import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { BookOpen, Clock, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Enrollment } from "@shared/schema";

export default function MyCourses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isTeacher = user?.role === "teacher";

  const { data: teacherCourses = [], isLoading: loadingTeacherCourses } = useQuery<Course[]>({
    queryKey: ["/api/teacher/courses"],
    enabled: isTeacher,
  });

  const { data: studentEnrollments = [], isLoading: loadingStudentEnrollments } = useQuery<
    (Enrollment & { course: Course & { teacher: { name: string } } })[]
  >({
    queryKey: ["/api/student/enrollments"],
    enabled: !isTeacher,
  });

  const isLoading = isTeacher ? loadingTeacherCourses : loadingStudentEnrollments;
  const courses = isTeacher ? teacherCourses : studentEnrollments.map((e) => e.course);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">My Courses</h1>
        <p className="text-muted-foreground">
          {isTeacher ? "Courses you're teaching" : "Courses you're enrolled in"}
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-sm text-muted-foreground">
              {isTeacher
                ? "Create your first course to get started"
                : "Browse and enroll in courses to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() =>
                setLocation(
                  isTeacher ? `/teacher/courses/${course.id}` : `/student/courses/${course.id}`
                )
              }
              data-testid={`course-card-${course.id}`}
            >
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                {!isTeacher && (course as any).teacher && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Instructor: {(course as any).teacher.name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
