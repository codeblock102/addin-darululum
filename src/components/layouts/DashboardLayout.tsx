
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

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [unreadNotifications] = useState(3);

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
                <Input 
                  placeholder="Search..." 
                  className="pl-10 bg-background/50 border-muted w-full" 
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
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
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
