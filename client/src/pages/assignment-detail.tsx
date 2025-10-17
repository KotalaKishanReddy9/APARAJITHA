import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Assignment, Submission, Grade } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function AssignmentDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/*/assignments/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submissionContent, setSubmissionContent] = useState("");

  const { data: assignment, isLoading } = useQuery<
    Assignment & { course: { title: string }; submissions: (Submission & { grades: Grade[] })[] }
  >({
    queryKey: ["/api/assignments", params?.id],
    enabled: !!params?.id,
  });

  const submitAssignmentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/submissions", {
        assignmentId: params?.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/assignments"] });
      setSubmissionContent("");
      toast({
        title: "Assignment submitted",
        description: "Your submission has been recorded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return <div>Assignment not found</div>;
  }

  const userSubmission = assignment.submissions.find((s) => s.studentId === user?.id);
  const grade = userSubmission?.grades[0];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Button
          variant="ghost"
          onClick={() => setLocation("/student/assignments")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-assignment-title">{assignment.title}</h1>
            <p className="text-muted-foreground">{assignment.course.title}</p>
          </div>
          <Badge variant={userSubmission ? "default" : "secondary"}>
            {userSubmission ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Submitted
              </>
            ) : (
              "Not Submitted"
            )}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Due Date</p>
            <p className="font-medium">{new Date(assignment.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Instructions</p>
            <p className="text-muted-foreground">{assignment.instructions}</p>
          </div>
        </CardContent>
      </Card>

      {userSubmission ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{userSubmission.content}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Submitted on {new Date(userSubmission.submittedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {grade ? (
            <Card>
              <CardHeader>
                <CardTitle>Grade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-primary">{grade.grade}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
                {grade.feedback && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Feedback</p>
                    <p className="text-muted-foreground">{grade.feedback}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Graded on {new Date(grade.gradedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Waiting for grade...</p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submit Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your assignment response here..."
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              className="min-h-[200px]"
              data-testid="input-submission"
            />
            <Button
              onClick={() => submitAssignmentMutation.mutate(submissionContent)}
              disabled={!submissionContent.trim() || submitAssignmentMutation.isPending}
              data-testid="button-submit-assignment"
            >
              <Upload className="h-4 w-4 mr-2" />
              {submitAssignmentMutation.isPending ? "Submitting..." : "Submit Assignment"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
