
import { ReactNode, useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationMenu } from "@/components/shared/NavigationMenu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NavItem } from "@/types/navigation";
import { Home, Users, BookOpen, CheckSquare, BarChart2, MessageSquare, User, GraduationCap, Calendar, TrendingUp } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  const {
    session
  } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [unreadNotifications] = useState(3);

  // Define navigation items here for both teacher and admin with proper NavItem structure
  const teacherNavItems: NavItem[] = [
    {
      href: "/teacher-portal",
      label: "Dashboard",
      icon: Home,
      description: "Overview dashboard",
      exact: true
    }, 
    {
      href: "/teacher-portal?tab=students",
      label: "My Students",
      icon: Users,
      description: "Manage your students"
    }, 
    {
      href: "/teacher-portal?tab=progress",
      label: "Progress Recording",
      icon: BookOpen,
      description: "Record student progress"
    }, 
    {
      href: "/teacher-portal?tab=grading",
      label: "Grading",
      icon: CheckSquare,
      description: "Grade student work"
    }, 
    {
      href: "/teacher-portal?tab=analytics",
      label: "Analytics",
      icon: BarChart2,
      description: "View performance analytics"
    }, 
    {
      href: "/teacher-portal?tab=messages",
      label: "Messages",
      icon: MessageSquare,
      description: "Communication center"
    }, 
    {
      href: "/teacher-portal?tab=profile",
      label: "Profile",
      icon: User,
      description: "Manage your profile"
    }
  ];
  
  const adminNavItems: NavItem[] = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      description: "Admin overview"
    }, 
    {
      href: "/students",
      label: "Students",
      icon: GraduationCap,
      description: "Manage students"
    }, 
    {
      href: "/teachers",
      label: "Teachers",
      icon: Users,
      description: "Manage teaching staff"
    }, 
    {
      href: "/schedule",
      label: "Schedule",
      icon: Calendar,
      description: "Manage class schedule"
    }, 
    {
      href: "/progress",
      label: "Progress",
      icon: TrendingUp,
      description: "Track student progress"
    }, 
    {
      href: "/attendance",
      label: "Attendance",
      icon: CheckSquare,
      description: "Track attendance records"
    }
  ];

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) return;
      try {
        const {
          data,
          error
        } = await supabase.from('teachers').select('id').eq('email', session.user.email);
        if (error) throw error;
        setIsTeacher(data && data.length > 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
      }
    };
    checkTeacherStatus();
  }, [session]);
  
  return <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-secondary/5">
        <Sidebar className="border-r border-border/30 bg-emerald-600 text-white">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-5">
              <span className="font-bold text-lg text-white">
                Quran Academy
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
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm p-4 rounded-lg shadow-sm">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-10 bg-background/50 border-muted w-full" />
              </div>
              <div className="flex items-center gap-4">
                
              </div>
            </div>
            <div className="animate-slideIn">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>;
};
