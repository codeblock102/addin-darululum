
import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Calendar, ChevronDown, FileText, Home, LayoutDashboard, LineChart, LogOut, School, Settings, Users } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { title?: string, titleId?: string }>;
  description: string;
  exact?: boolean;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, signOut } = useAuth();
  const user = session?.user;
  const [isTeacher, setIsTeacher] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
  const adminNavItems: NavItem[] = [
    { href: "/", label: "Dashboard", icon: Home, description: "Overview of all activities" },
    { href: "/students", label: "Students", icon: Users, description: "Manage student profiles" },
    { href: "/teachers", label: "Teachers", icon: School, description: "Manage teaching staff" },
    { href: "/schedule", label: "Schedule", icon: Calendar, description: "View and manage classes" },
    { href: "/progress", label: "Progress", icon: LineChart, description: "Student progress tracker" },
    { href: "/attendance", label: "Attendance", icon: FileText, description: "Track attendance records" },
    { href: "/teacher-portal", label: "Teacher Portal", icon: LayoutDashboard, description: "Access teacher dashboard" },
    { href: "/settings", label: "Settings", icon: Settings, description: "System preferences" },
  ];

  const teacherNavItems: NavItem[] = [
    { href: "/teacher-portal", exact: true, label: "Dashboard", icon: Home, description: "Teacher overview" },
    { href: "/teacher-portal?tab=students", label: "My Students", icon: Users, description: "View assigned students" },
    { href: "/teacher-portal?tab=progress", label: "Record Progress", icon: LineChart, description: "Log student progress" },
    { href: "/teacher-portal?tab=grading", label: "Grading", icon: FileText, description: "Evaluate performances" },
    { href: "/teacher-portal?tab=analytics", label: "Analytics", icon: LineChart, description: "Performance insights" },
    { href: "/teacher-portal?tab=messages", label: "Messages", icon: BookOpen, description: "Communication hub" },
    { href: "/teacher-portal?tab=profile", label: "My Profile", icon: Settings, description: "Account settings" },
  ];

  const navItems = isTeacher ? teacherNavItems : adminNavItems;

  // Check if a nav item is active
  const isNavItemActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.href && !location.search;
    }
    
    if (item.href.includes('?tab=')) {
      const [path, search] = item.href.split('?');
      return location.pathname === path && location.search.includes(search);
    }
    
    return location.pathname === item.href;
  };

  // Handle sign out with confirmation
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account"
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not sign out. Please try again."
      });
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-3">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Quran Academy</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton 
                    isActive={isNavItemActive(item)}
                    onClick={() => navigate(item.href)}
                    tooltip={item.description}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage alt="User avatar" />
                          <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <div className="text-sm font-medium">
                            {user?.email?.split("@")[0] || "User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isTeacher ? "Teacher" : "Administrator"}
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate("/account")}>
                      My Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/preferences")}>
                      Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-6 overflow-auto animate-fadeIn">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <SidebarTrigger className="inline-block" />
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
