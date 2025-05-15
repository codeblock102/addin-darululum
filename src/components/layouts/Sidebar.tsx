
import { Link } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldCheck, BookOpen } from "lucide-react";
import { adminNavItems, teacherNavItems } from "@/config/navigation";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SidebarUser } from "./sidebar/SidebarUser";

interface SidebarProps {
  onCloseSidebar?: () => void;
}

export const Sidebar = ({ onCloseSidebar }: SidebarProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isTeacher, isAdmin } = useTeacherStatus();
  const navItems = isTeacher ? teacherNavItems : adminNavItems;
  
  const styles = {
    sidebar: isAdmin 
      ? "bg-[#131724] border-r border-white/5 text-white shadow-xl"
      : "bg-background border-r",
    header: isAdmin ? "border-b border-white/10" : "border-b",
  };

  return (
    <div className={`flex h-full w-full flex-col ${styles.sidebar}`}>
      <div className={`flex h-14 sm:h-16 items-center ${styles.header} justify-between pl-4 pr-2 sm:pl-5 sm:pr-4`}>
        <Link 
          to={isTeacher ? "/teacher-portal" : "/"} 
          className="flex items-center gap-2 font-semibold"
        >
          {isAdmin ? (
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
          ) : (
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
          <span className="text-white text-sm sm:text-base">
            {isAdmin ? "Admin Portal" : "Teacher Portal"}
          </span>
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" className="text-white" onClick={onCloseSidebar}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Close Menu</span>
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto py-2 sm:py-4">
        <SidebarNav items={navItems} isAdmin={isAdmin} />
      </div>

      <SidebarUser isAdmin={isAdmin} />
    </div>
  );
};
