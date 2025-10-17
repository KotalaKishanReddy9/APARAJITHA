import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { FileText, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Assignment } from "@shared/schema";

export default function TeacherAssignments() {
  const [, setLocation] = useLocation();

  const { data: assignments = [], isLoading } = useQuery<
    (Assignment & { course: { title: string }; _count: { submissions: number } })[]
  >({
    queryKey: ["/api/teacher/assignments"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Assignments</h1>
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
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Assignments</h1>
        <p className="text-muted-foreground">Manage and grade student assignments</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
            <p className="text-sm text-muted-foreground">
              Create assignments from your course pages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card
              key={assignment.id}
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => setLocation(`/teacher/assignments/${assignment.id}`)}
              data-testid={`assignment-card-${assignment.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{assignment.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{assignment.course.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{assignment._count?.submissions || 0} submissions</span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
