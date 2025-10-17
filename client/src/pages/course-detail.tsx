import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, FileText, MessageSquare, FolderOpen, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, Assignment, Discussion, Material } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

export default function CourseDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/*/courses/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [discussionContent, setDiscussionContent] = useState("");

  const { data: course, isLoading } = useQuery<Course & { teacher: { name: string } }>({
    queryKey: ["/api/courses", params?.id],
    enabled: !!params?.id,
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/courses", params?.id, "assignments"],
    enabled: !!params?.id,
  });

  const { data: discussions = [] } = useQuery<(Discussion & { user: { name: string } })[]>({
    queryKey: ["/api/courses", params?.id, "discussions"],
    enabled: !!params?.id,
  });

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["/api/courses", params?.id, "materials"],
    enabled: !!params?.id,
  });

  const { data: enrollments = [] } = useQuery<{ student: { name: string; email: string } }[]>({
    queryKey: ["/api/courses", params?.id, "enrollments"],
    enabled: !!params?.id && user?.role === "teacher",
  });

  const postDiscussionMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/discussions", {
        courseId: params?.id,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", params?.id, "discussions"] });
      setDiscussionContent("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added to the discussion",
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

  if (!course) {
    return <div>Course not found</div>;
  }

  const isTeacher = user?.role === "teacher" && course.teacherId === user.id;

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => setLocation(user?.role === "teacher" ? "/teacher/courses" : "/student/courses")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-course-title">{course.title}</h1>
            <p className="text-muted-foreground">Instructor: {course.teacher.name}</p>
          </div>
          {isTeacher && (
            <div className="flex gap-2">
              <Button
                onClick={() => setLocation(`/teacher/courses/${course.id}/assignments/new`)}
                data-testid="button-create-assignment"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation(`/teacher/courses/${course.id}/materials/upload`)}
                data-testid="button-upload-material"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Material
              </Button>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About this Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{course.description}</p>
          <p className="text-sm text-muted-foreground mt-4">Duration: {course.duration}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            <FileText className="h-4 w-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="discussions" data-testid="tab-discussions">
            <MessageSquare className="h-4 w-4 mr-2" />
            Discussions
          </TabsTrigger>
          <TabsTrigger value="materials" data-testid="tab-materials">
            <FolderOpen className="h-4 w-4 mr-2" />
            Materials
          </TabsTrigger>
          {isTeacher && (
            <TabsTrigger value="students" data-testid="tab-students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No assignments yet</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} data-testid={`assignment-${assignment.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{assignment.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        setLocation(
                          isTeacher
                            ? `/teacher/assignments/${assignment.id}`
                            : `/student/assignments/${assignment.id}`
                        )
                      }
                      data-testid={`button-view-assignment-${assignment.id}`}
                    >
                      View
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{assignment.instructions}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post a Comment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Share your thoughts or ask a question..."
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                data-testid="input-discussion"
              />
              <Button
                onClick={() => postDiscussionMutation.mutate(discussionContent)}
                disabled={!discussionContent.trim() || postDiscussionMutation.isPending}
                data-testid="button-post-discussion"
              >
                {postDiscussionMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </CardContent>
          </Card>

          {discussions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No discussions yet</p>
              </CardContent>
            </Card>
          ) : (
            discussions.map((discussion) => (
              <Card key={discussion.id} data-testid={`discussion-${discussion.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{discussion.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{discussion.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          {materials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No materials uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            materials.map((material) => (
              <Card key={material.id} data-testid={`material-${material.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{material.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.fileType} • Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" data-testid={`button-download-${material.id}`}>
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {isTeacher && (
          <TabsContent value="students" className="space-y-4">
            {enrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No students enrolled yet</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enrollments.map((enrollment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`student-${index}`}
                      >
                        <div>
                          <p className="font-medium">{enrollment.student.name}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.student.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
