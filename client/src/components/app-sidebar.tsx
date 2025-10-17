import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  FileText,
  MessageSquare,
  BarChart3,
  FolderOpen,
  Users,
  LogOut,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const teacherMenuItems = [
    {
      title: "Dashboard",
      url: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "My Courses",
      url: "/teacher/courses",
      icon: BookOpen,
    },
    {
      title: "Students",
      url: "/teacher/students",
      icon: Users,
    },
    {
      title: "Assignments",
      url: "/teacher/assignments",
      icon: FileText,
    },
    {
      title: "Grades",
      url: "/teacher/grades",
      icon: BarChart3,
    },
  ];

  const studentMenuItems = [
    {
      title: "Dashboard",
      url: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Browse Courses",
      url: "/student/browse",
      icon: BookOpen,
    },
    {
      title: "My Courses",
      url: "/student/courses",
      icon: FolderOpen,
    },
    {
      title: "Assignments",
      url: "/student/assignments",
      icon: FileText,
    },
    {
      title: "Grades",
      url: "/student/grades",
      icon: BarChart3,
    },
  ];

  const menuItems = user.role === "teacher" ? teacherMenuItems : studentMenuItems;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">EduLearn</h2>
              <Badge variant="secondary" className="text-xs">
                {user.role === "teacher" ? "Teacher" : "Student"}
              </Badge>
            </div>
          </div>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
