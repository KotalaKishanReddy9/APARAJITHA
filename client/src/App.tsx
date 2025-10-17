import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthProvider, useAuth } from "@/lib/auth";
import ErrorBoundary from "@/components/error-boundary";
import { NotificationsPanel } from "@/components/notifications-panel";
import { useWebSocket } from "@/lib/useWebSocket";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import BrowseCourses from "@/pages/browse-courses";
import CreateCourse from "@/pages/create-course";
import CourseDetail from "@/pages/course-detail";
import StudentAssignments from "@/pages/student-assignments";
import AssignmentDetail from "@/pages/assignment-detail";
import CreateAssignment from "@/pages/create-assignment";
import TeacherAssignmentGrading from "@/pages/teacher-assignment-grading";
import StudentGrades from "@/pages/student-grades";
import MyCourses from "@/pages/my-courses";
import UploadMaterial from "@/pages/upload-material";
import TeacherAssignments from "@/pages/teacher-assignments";
import TeacherStudents from "@/pages/teacher-students";
import TeacherGrades from "@/pages/teacher-grades";
import { useEffect } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (user && location === "/") {
      setLocation(user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }
  }, [user, location, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      <Route path="/student/dashboard">
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student/browse">
        <ProtectedRoute>
          <BrowseCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses">
        <ProtectedRoute>
          <MyCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses/:id">
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/student/assignments">
        <ProtectedRoute>
          <StudentAssignments />
        </ProtectedRoute>
      </Route>
      <Route path="/student/assignments/:id">
        <ProtectedRoute>
          <AssignmentDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/student/grades">
        <ProtectedRoute>
          <StudentGrades />
        </ProtectedRoute>
      </Route>

      <Route path="/teacher/dashboard">
        <ProtectedRoute>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/courses">
        <ProtectedRoute>
          <MyCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/courses/new">
        <ProtectedRoute>
          <CreateCourse />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/courses/:id">
        <ProtectedRoute>
          <CourseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/courses/:courseId/assignments/new">
        <ProtectedRoute>
          <CreateAssignment />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/courses/:courseId/materials/upload">
        <ProtectedRoute>
          <UploadMaterial />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/assignments">
        <ProtectedRoute>
          <TeacherAssignments />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/assignments/:id">
        <ProtectedRoute>
          <TeacherAssignmentGrading />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/students">
        <ProtectedRoute>
          <TeacherStudents />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/grades">
        <ProtectedRoute>
          <TeacherGrades />
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <ProtectedRoute>
          <div>Redirecting...</div>
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [location] = useLocation();
  const isAuthPage = location === "/login" || location === "/register";
  useWebSocket();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  if (isAuthPage || !user) {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <NotificationsPanel />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <TooltipProvider>
              <AppContent />
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
