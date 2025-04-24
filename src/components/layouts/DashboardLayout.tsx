import { ReactNode, useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider } from "@/components/ui/sidebar";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavigationMenu } from "@/components/shared/NavigationMenu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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

  // Define navigation items here for both teacher and admin
  const teacherNavItems = [{
    title: "Dashboard",
    href: "/teacher-portal",
    icon: "Home"
  }, {
    title: "My Students",
    href: "/teacher-portal?tab=students",
    icon: "Users"
  }, {
    title: "Progress Recording",
    href: "/teacher-portal?tab=progress",
    icon: "BookOpen"
  }, {
    title: "Grading",
    href: "/teacher-portal?tab=grading",
    icon: "CheckSquare"
  }, {
    title: "Analytics",
    href: "/teacher-portal?tab=analytics",
    icon: "BarChart2"
  }, {
    title: "Messages",
    href: "/teacher-portal?tab=messages",
    icon: "MessageSquare"
  }, {
    title: "Profile",
    href: "/teacher-portal?tab=profile",
    icon: "User"
  }];
  const adminNavItems = [{
    title: "Dashboard",
    href: "/",
    icon: "Home"
  }, {
    title: "Students",
    href: "/students",
    icon: "GraduationCap"
  }, {
    title: "Teachers",
    href: "/teachers",
    icon: "Users"
  }, {
    title: "Schedule",
    href: "/schedule",
    icon: "Calendar"
  }, {
    title: "Progress",
    href: "/progress",
    icon: "TrendingUp"
  }, {
    title: "Attendance",
    href: "/attendance",
    icon: "CheckSquare"
  }];
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
          
          <SidebarContent className="i cant see anything here\n">
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