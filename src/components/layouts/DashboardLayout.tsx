
import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen } from "lucide-react";
import { NavigationMenu } from "@/components/shared/NavigationMenu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { adminNavItems, teacherNavItems } from "@/config/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { session } = useAuth();
  const user = session?.user;
  const [isTeacher, setIsTeacher] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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

  const navItems = isTeacher ? teacherNavItems : adminNavItems;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-secondary/20">
        <Sidebar className="border-r border-border/30 backdrop-blur-sm bg-background/80">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
                Quran Academy
              </span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <NavigationMenu items={navItems} />
          </SidebarContent>
          
          <SidebarFooter>
            <UserAvatar isTeacher={isTeacher} />
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-6 overflow-auto animate-fadeIn">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <SidebarTrigger className="inline-block hover:bg-accent/50 transition-colors" />
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="relative hover:scale-105 transition-transform"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center animate-in fade-in">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
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
