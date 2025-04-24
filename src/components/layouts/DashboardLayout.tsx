
import { ReactNode, useState, useEffect } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarProvider
} from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationMenu } from "@/components/shared/NavigationMenu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { 
  BookOpen, 
  Calendar, 
  CalendarCheck, 
  CalendarDays, 
  ClipboardCheck, 
  GraduationCap, 
  Home, 
  LineChart, 
  BarChart, 
  MessageSquare, 
  School, 
  Settings, 
  UserCircle, 
  Users 
} from "lucide-react";
import { NavItem } from "@/types/navigation";

const adminNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, description: "Overview dashboard" },
  { href: "/students", label: "Students", icon: Users, description: "Manage students" },
  { href: "/teachers", label: "Teachers", icon: School, description: "Manage teachers" },
  { href: "/schedule", label: "Schedule", icon: CalendarDays, description: "View schedules" },
  { href: "/progress", label: "Progress", icon: LineChart, description: "Track progress" },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck, description: "Record attendance" },
  { href: "/teacher-portal", label: "Teacher Portal", icon: GraduationCap, description: "Access teacher portal" },
];

const teacherNavItems: NavItem[] = [
  { href: "/teacher-portal", label: "Dashboard", icon: Home, description: "Teacher dashboard", exact: true },
  { href: "/teacher-portal?tab=students", label: "Students", icon: Users, description: "View students" },
  { href: "/teacher-portal?tab=progress", label: "Progress", icon: BookOpen, description: "Record student progress" },
  { href: "/teacher-portal?tab=grading", label: "Grading", icon: ClipboardCheck, description: "Grade student work" },
  { href: "/teacher-portal?tab=analytics", label: "Analytics", icon: BarChart, description: "View analytics" },
  { href: "/teacher-portal?tab=messages", label: "Messages", icon: MessageSquare, description: "Message students" },
  { href: "/teacher-portal?tab=profile", label: "Profile", icon: UserCircle, description: "Manage profile" },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [unreadNotifications] = useState(3); // Example notification count

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        
        setIsTeacher(data && data.length > 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-secondary/5">
        <Sidebar className="border-r border-border/30 bg-emerald-600 text-white">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-5">
              <BookOpen className="h-6 w-6 text-white" />
              <span className="font-bold text-lg text-white">
                {isTeacher ? "Teacher Portal" : "Quran Academy"}
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <NavigationMenu items={isTeacher ? teacherNavItems : adminNavItems} />
          </SidebarContent>
          
          <SidebarFooter>
            <UserAvatar isTeacher={isTeacher} />
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-6 overflow-auto animate-fadeIn">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 bg-background border-muted w-full" 
                />
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="relative hover:scale-105 transition-transform"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center animate-in fade-in">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
                <UserAvatar isTeacher={isTeacher} large />
              </div>
            </div>
            <div className="animate-slideIn">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
