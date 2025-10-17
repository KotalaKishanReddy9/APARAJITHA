import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TeacherStudents() {
  const { data: enrollments = [], isLoading } = useQuery<
    { student: { id: string; name: string; email: string }; course: { title: string } }[]
  >({
    queryKey: ["/api/teacher/students"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const studentMap = new Map<string, { name: string; email: string; courses: string[] }>();
  enrollments.forEach((enrollment) => {
    const existing = studentMap.get(enrollment.student.id);
    if (existing) {
      existing.courses.push(enrollment.course.title);
    } else {
      studentMap.set(enrollment.student.id, {
        name: enrollment.student.name,
        email: enrollment.student.email,
        courses: [enrollment.course.title],
      });
    }
  });

  const students = Array.from(studentMap.values());

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Students</h1>
        <p className="text-muted-foreground">Students enrolled in your courses</p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No students yet</h3>
            <p className="text-sm text-muted-foreground">
              Students will appear here once they enroll in your courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student, index) => (
            <Card key={index} data-testid={`student-card-${index}`}>
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Enrolled in {student.courses.length} {student.courses.length === 1 ? "course" : "courses"}
                      </p>
                      {student.courses.map((course, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {course}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
