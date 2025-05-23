
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BookOpen, ChevronLeft, X } from "lucide-react";
import { adminNavItems, teacherNavItems } from "@/config/navigation";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SidebarUser } from "./sidebar/SidebarUser";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onCloseSidebar?: () => void;
  toggleSidebar?: () => void;
}

export const Sidebar = ({ onCloseSidebar, toggleSidebar }: SidebarProps) => {
  const isMobile = useIsMobile();
  const { isTeacher, isAdmin } = useTeacherStatus();
  const navItems = isTeacher ? teacherNavItems : adminNavItems;

  // Handle mobile navigation events
  useEffect(() => {
    const handleNavigation = () => {
      if (onCloseSidebar && isMobile) {
        onCloseSidebar();
      }
    };

    window.addEventListener('navigate-mobile', handleNavigation);
    
    return () => {
      window.removeEventListener('navigate-mobile', handleNavigation);
    };
  }, [onCloseSidebar, isMobile]);

  return (
    <div className="relative h-full flex flex-col sidebar">
      {/* Close button for mobile */}
      {isMobile && onCloseSidebar && (
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "absolute top-3 right-3 z-50",
            isAdmin ? "text-white hover:bg-white/10" : ""
          )}
          onClick={onCloseSidebar}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      
      <div className={cn(
        "flex h-full w-full flex-col",
        isAdmin 
          ? "bg-[#131724] text-white" 
          : "bg-white text-gray-800"
      )}>
        <div className={cn(
          "flex h-14 sm:h-16 items-center justify-between pl-4 pr-5 sm:pl-5", 
          isAdmin 
            ? "border-b border-white/10" 
            : "border-b border-gray-100"
        )}>
          <Link 
            to={isTeacher ? "/teacher-portal" : "/"} 
            className="flex items-center gap-2 font-semibold"
          >
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
            ) : (
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            )}
            <span className={cn(
              "text-sm sm:text-base",
              isAdmin ? "text-white" : "text-gray-800"
            )}>
              {isAdmin ? "Admin Portal" : "Teacher Portal"}
            </span>
          </Link>
          
          {!isMobile && toggleSidebar && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={isAdmin ? "text-white hover:bg-white/10" : ""}
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-auto py-2 sm:py-4">
          <SidebarNav items={navItems} isAdmin={isAdmin} />
        </div>

        <SidebarUser isAdmin={isAdmin} />
      </div>
    </div>
  );
};
