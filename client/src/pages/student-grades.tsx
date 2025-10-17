import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Grade, Submission, Assignment } from "@shared/schema";

export default function StudentGrades() {
  const { data: grades = [], isLoading } = useQuery<
    (Grade & {
      submission: Submission & {
        assignment: Assignment & { course: { title: string } };
      };
    })[]
  >({
    queryKey: ["/api/student/grades"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Grades</h1>
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

  const averageGrade =
    grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + g.grade, 0) / grades.length)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">My Grades</h1>
        <p className="text-muted-foreground">Track your academic performance</p>
      </div>

      {grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="p-4 bg-primary/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Grade</p>
                <p className="text-4xl font-bold" data-testid="text-average-grade">{averageGrade}%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on {grades.length} graded {grades.length === 1 ? "assignment" : "assignments"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No grades yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Grades will appear here once your assignments are graded
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {grades.map((grade) => (
                <Card key={grade.id} data-testid={`grade-${grade.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{grade.submission.assignment.title}</p>
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
                        <div
                          className={`text-3xl font-bold ${
                            grade.grade >= 90
                              ? "text-green-600 dark:text-green-400"
                              : grade.grade >= 80
                              ? "text-blue-600 dark:text-blue-400"
                              : grade.grade >= 70
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {grade.grade}
                        </div>
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
