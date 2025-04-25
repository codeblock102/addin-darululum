
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  BookOpen, 
  CalendarDays, 
  ChevronLeft, 
  Home, 
  LineChart, 
  LogOut, 
  School, 
  Settings, 
  Users,
  CalendarCheck,
  GraduationCap,
  BookText,
  ClipboardCheck,
  BarChart,
  MessageSquare,
  UserCircle
} from "lucide-react";

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
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

  // Extracting user's initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split("@")[0].split(".");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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

  // Define navigation items
  const adminNavItems = [
    { href: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/students", label: "Students", icon: <Users className="h-5 w-5" /> },
    { href: "/teachers", label: "Teachers", icon: <School className="h-5 w-5" /> },
    { href: "/classes", label: "Classes", icon: <CalendarDays className="h-5 w-5" /> },
    { href: "/progress", label: "Progress", icon: <LineChart className="h-5 w-5" /> },
    { href: "/attendance", label: "Attendance", icon: <CalendarCheck className="h-5 w-5" /> },
    { href: "/teacher-portal", label: "Teacher Portal", icon: <GraduationCap className="h-5 w-5" /> },
  ];

  const teacherNavItems = [
    { href: "/teacher-portal", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/teacher-portal?tab=students", label: "My Students", icon: <Users className="h-5 w-5" /> },
    { href: "/teacher-portal?tab=progress", label: "Record Progress", icon: <BookText className="h-5 w-5" /> },
    { href: "/teacher-portal?tab=grading", label: "Grading", icon: <ClipboardCheck className="h-5 w-5" /> },
    { href: "/teacher-portal?tab=analytics", label: "Analytics", icon: <BarChart className="h-5 w-5" /> },
    { href: "/teacher-portal?tab=messages", label: "Messages", icon: <MessageSquare className="h-5 w-5" /> },
    { href: "/teacher-portal?tab=profile", label: "My Profile", icon: <UserCircle className="h-5 w-5" /> },
  ];

  // Choose navItems based on user role
  const navItems = isTeacher ? teacherNavItems : adminNavItems;

  return (
    <div className="flex h-screen flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link 
          to={isTeacher ? "/teacher-portal" : "/"} 
          className="flex items-center gap-2 font-semibold"
        >
          <BookOpen className="h-6 w-6" />
          <span className="hidden md:inline-block">
            {isTeacher ? "Teacher Portal" : "Quran Academy"}
          </span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" className="ml-auto">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => {
            // For teacher items with tabs, check if the current URL includes the tab
            const isActive = isTeacher && item.href.includes('?tab=')
              ? location.pathname === '/teacher-portal' && location.search.includes(item.href.split('?')[1])
              : location.pathname === item.href;
              
            return (
              <Link
                key={index}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                {item.icon}
                <span className="hidden md:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t px-2 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-9 w-9">
            <AvatarImage alt="User avatar" />
            <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
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
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
