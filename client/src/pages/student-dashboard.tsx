import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { BookOpen, FileText, BarChart3, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Course, Assignment, Enrollment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoading, CardLoading } from "@/components/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: enrollments = [], isLoading: loadingEnrollments, error: enrollmentsError } = useQuery<(Enrollment & { course: Course })[]>({
    queryKey: ["/api/student/enrollments"],
    retry: 2,
  });

  const { data: assignments = [], isLoading: loadingAssignments, error: assignmentsError } = useQuery<Assignment[]>({
    queryKey: ["/api/student/assignments/pending"],
    retry: 2,
  });

  const stats = [
    {
      title: "Enrolled Courses",
      value: enrollments.length,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Pending Assignments",
      value: assignments.length,
      icon: FileText,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Average Grade",
      value: "-",
      icon: BarChart3,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  if (loadingEnrollments || loadingAssignments) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>My Courses</CardTitle></CardHeader>
            <CardContent><CardLoading /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Upcoming Assignments</CardTitle></CardHeader>
            <CardContent><CardLoading /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (enrollmentsError || assignmentsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't enrolled in any courses yet
                </p>
                <Button onClick={() => setLocation("/student/browse")} data-testid="button-browse-courses">
                  Browse Courses
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.slice(0, 3).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-3 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => setLocation(`/student/courses/${enrollment.course.id}`)}
                    data-testid={`course-card-${enrollment.course.id}`}
                  >
                    <h4 className="font-semibold">{enrollment.course.title}</h4>
                    <p className="text-sm text-muted-foreground">{enrollment.course.duration}</p>
                  </div>
                ))}
                {enrollments.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setLocation("/student/courses")}
                    data-testid="button-view-all-courses"
                  >
                    View all courses
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No pending assignments
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 3).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-3 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => setLocation("/student/assignments")}
                    data-testid={`assignment-card-${assignment.id}`}
                  >
                    <h4 className="font-semibold">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {assignments.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setLocation("/student/assignments")}
                    data-testid="button-view-all-assignments"
                  >
                    View all assignments
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
