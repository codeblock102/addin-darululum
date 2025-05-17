
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useRBAC } from "@/hooks/useRBAC";
import { LoadingSpinner } from "./dashboard/LoadingSpinner";
import { BackgroundPattern } from "./dashboard/BackgroundPattern";
import { RoleBadge } from "./dashboard/RoleBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isLoading } = useRBAC();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full overflow-hidden ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      {/* Sidebar with conditional display on mobile */}
      <div className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-300 ease-in-out
        fixed inset-y-0 left-0 z-40 w-64 lg:relative lg:translate-x-0
        ${isMobile ? "shadow-xl" : ""}
      `}>
        <Sidebar onCloseSidebar={() => setSidebarOpen(false)} toggleSidebar={toggleSidebar} />
      </div>
      
      {/* Mobile menu button - only visible on mobile */}
      {isMobile && !sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 bg-background/80 backdrop-blur-sm shadow-md rounded-full"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      )}
      
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${isMobile ? "pt-16 pb-20" : ""}`}>
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-full">
            <div className="max-w-7xl mx-auto">
              <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />
              <div className="animate-fadeIn">{children}</div>
            </div>
          </div>
        </BackgroundPattern>
      </div>
    </div>
  );
}
