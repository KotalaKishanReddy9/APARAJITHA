import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Grade, Submission, Assignment } from "@shared/schema";

export default function TeacherGrades() {
  const { data: grades = [], isLoading } = useQuery<
    (Grade & {
      submission: Submission & {
        student: { name: string };
        assignment: Assignment & { course: { title: string } };
      };
    })[]
  >({
    queryKey: ["/api/teacher/grades"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Grades</h1>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Grades</h1>
        <p className="text-muted-foreground">All grades you've submitted</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grading History</CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No grades submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <Card key={grade.id} data-testid={`grade-${grade.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{grade.submission.student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {grade.submission.assignment.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {grade.submission.assignment.course.title}
                        </p>
                        {grade.feedback && (
                          <p className="text-sm text-muted-foreground mt-2">{grade.feedback}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Graded {new Date(grade.gradedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-3xl font-bold text-primary">{grade.grade}</div>
                        <p className="text-sm text-muted-foreground">/ 100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
