
import { ReactNode } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, 
  Home, 
  Users, 
  School, 
  CalendarDays, 
  LineChart,
  CalendarCheck,
  Settings,
  GraduationCap,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const [isTeacher, setIsTeacher] = useState(false);

  // Check if the current user is a teacher
  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', user.email);
          
        if (error) throw error;
        
        setIsTeacher(data && data.length > 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
      }
    };
    
    checkTeacherStatus();
  }, [user]);

  // Extract user's initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split("@")[0].split(".");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Define navigation items
  const adminNavItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/students", label: "Students", icon: Users },
    { href: "/teachers", label: "Teachers", icon: School },
    { href: "/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/progress", label: "Progress", icon: LineChart },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/teacher-portal", label: "Teacher Portal", icon: GraduationCap },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const teacherNavItems = [
    { href: "/teacher-portal", label: "Dashboard", icon: Home },
    { href: "/teacher-portal?tab=students", label: "My Students", icon: Users },
    { href: "/teacher-portal?tab=progress", label: "Record Progress", icon: LineChart },
    { href: "/teacher-portal?tab=grading", label: "Grading", icon: School },
    { href: "/teacher-portal?tab=analytics", label: "Analytics", icon: LineChart },
    { href: "/teacher-portal?tab=messages", label: "Messages", icon: BookOpen },
    { href: "/teacher-portal?tab=profile", label: "My Profile", icon: Settings },
  ];

  const navItems = isTeacher ? teacherNavItems : adminNavItems;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Quran Academy</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item, index) => {
                // For teacher items with tabs, check if the current URL includes the tab
                const isActive = item.href.includes('?tab=')
                  ? location.pathname === '/teacher-portal' && location.search.includes(item.href.split('?')[1])
                  : location.pathname === item.href;
                  
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => navigate(item.href)}
                      tooltip={item.label}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage alt="User avatar" />
                  <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">
                    {user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email || "user@example.com"}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-auto" 
                  onClick={() => signOut()}
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-6 overflow-auto animate-fadeIn">
          <div className="max-w-7xl mx-auto">
            <SidebarTrigger className="mb-4" />
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
