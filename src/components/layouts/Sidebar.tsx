
import { Link } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShieldCheck, BookOpen } from "lucide-react";
import { adminNavItems, teacherNavItems } from "@/config/navigation";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { SidebarNav } from "./sidebar/SidebarNav";
import { SidebarUser } from "./sidebar/SidebarUser";

export const Sidebar = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { isTeacher, isAdmin } = useTeacherStatus();
  const navItems = isTeacher ? teacherNavItems : adminNavItems;
  
  const styles = {
    sidebar: isAdmin 
      ? "bg-[#1A1F2C]/95 backdrop-blur-xl border-r border-white/10 text-white shadow-xl"
      : "bg-background border-r",
    header: isAdmin ? "border-b border-white/10" : "border-b",
  };

  return (
    <div className={`flex h-screen flex-col ${styles.sidebar}`}>
      <div className={`flex h-14 items-center ${styles.header} px-4 lg:h-[60px] lg:px-6`}>
        <Link 
          to={isTeacher ? "/teacher-portal" : "/"} 
          className="flex items-center gap-2 font-semibold"
        >
          {isAdmin ? (
            <ShieldCheck className="h-6 w-6 text-amber-400" />
          ) : (
            <BookOpen className="h-6 w-6" />
          )}
          <span className="hidden md:inline-block">
            {isAdmin ? "Admin Portal" : "Teacher Portal"}
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
        <SidebarNav items={navItems} isAdmin={isAdmin} />
      </div>

      <SidebarUser isAdmin={isAdmin} />
    </div>
  );
};
