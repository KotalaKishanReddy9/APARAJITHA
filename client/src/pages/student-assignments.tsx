import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Assignment, Submission } from "@shared/schema";

export default function StudentAssignments() {
  const [, setLocation] = useLocation();

  const { data: assignments = [], isLoading } = useQuery<
    (Assignment & { course: { title: string }; submissions: Submission[] })[]
  >({
    queryKey: ["/api/student/assignments"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Assignments</h1>
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

  const pendingAssignments = assignments.filter((a) => a.submissions.length === 0);
  const submittedAssignments = assignments.filter((a) => a.submissions.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">My Assignments</h1>
        <p className="text-muted-foreground">Track and submit your course assignments</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Assignments</h2>
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p className="text-sm text-muted-foreground">All caught up! No pending assignments.</p>
              </CardContent>
            </Card>
          ) : (
            pendingAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => setLocation(`/student/assignments/${assignment.id}`)}
                data-testid={`assignment-card-${assignment.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-base">{assignment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.course.title}</p>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Submitted</h2>
          {submittedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No submitted assignments yet</p>
              </CardContent>
            </Card>
          ) : (
            submittedAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="hover-elevate active-elevate-2 cursor-pointer"
                onClick={() => setLocation(`/student/assignments/${assignment.id}`)}
                data-testid={`submitted-assignment-${assignment.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-base">{assignment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.course.title}</p>
                    </div>
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
