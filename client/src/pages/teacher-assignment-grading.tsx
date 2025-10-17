import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import type { Assignment, Submission, Grade } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function TeacherAssignmentGrading() {
  const [, params] = useRoute("/teacher/assignments/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data: assignment, isLoading } = useQuery<
    Assignment & {
      course: { title: string };
      submissions: (Submission & { student: { name: string; email: string }; grades: Grade[] })[];
    }
  >({
    queryKey: ["/api/assignments", params?.id],
    enabled: !!params?.id,
  });

  const gradeMutation = useMutation({
    mutationFn: async (data: { submissionId: string; grade: number; feedback: string }) => {
      return await apiRequest("POST", "/api/grades", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", params?.id] });
      setGradingSubmissionId(null);
      setGradeValue("");
      setFeedback("");
      toast({
        title: "Grade submitted",
        description: "The grade has been recorded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Grading failed",
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

  const submittedCount = assignment.submissions.length;
  const gradedCount = assignment.submissions.filter((s) => s.grades.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => setLocation("/teacher/assignments")}
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
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
            <p className="text-sm font-medium mt-1">
              {gradedCount} / {submittedCount} graded
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{assignment.instructions}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions ({submittedCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {assignment.submissions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignment.submissions.map((submission) => {
                const grade = submission.grades[0];
                return (
                  <Card key={submission.id} data-testid={`submission-${submission.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{submission.student.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{submission.student.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {grade ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Graded: {grade.grade}/100
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Submission</p>
                          <p className="text-sm text-muted-foreground">{submission.content}</p>
                        </div>
                        {grade ? (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Feedback</p>
                            <p className="text-sm text-muted-foreground">{grade.feedback || "No feedback provided"}</p>
                          </div>
                        ) : (
                          <Dialog
                            open={gradingSubmissionId === submission.id}
                            onOpenChange={(open) => {
                              if (!open) {
                                setGradingSubmissionId(null);
                                setGradeValue("");
                                setFeedback("");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => setGradingSubmissionId(submission.id)}
                                data-testid={`button-grade-${submission.id}`}
                              >
                                Grade Submission
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Grade Submission</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Grade (0-100)</label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gradeValue}
                                    onChange={(e) => setGradeValue(e.target.value)}
                                    placeholder="85"
                                    data-testid="input-grade"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Feedback (optional)</label>
                                  <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Great work! Consider..."
                                    data-testid="input-feedback"
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    gradeMutation.mutate({
                                      submissionId: submission.id,
                                      grade: parseInt(gradeValue),
                                      feedback,
                                    });
                                  }}
                                  disabled={!gradeValue || gradeMutation.isPending}
                                  className="w-full"
                                  data-testid="button-submit-grade"
                                >
                                  {gradeMutation.isPending ? "Submitting..." : "Submit Grade"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
