import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useRBAC } from "@/hooks/useRBAC";
import { LoadingSpinner } from "./dashboard/LoadingSpinner";
import { BackgroundPattern } from "./dashboard/BackgroundPattern";
import { RoleBadge } from "./dashboard/RoleBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isLoading } = useRBAC();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const location = useLocation();
  
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [location.pathname, location.search, isMobile, sidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const sidebarWidthClass = "w-64";
  const collapsedSidebarWidthClass = "md:w-16";

  return (
    <div className={`flex min-h-screen w-full overflow-hidden ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background border-r transition-all duration-300 ease-in-out",
          isMobile && sidebarOpen && `${sidebarWidthClass} translate-x-0 shadow-xl`,
          isMobile && !sidebarOpen && `${sidebarWidthClass} -translate-x-full`,
          !isMobile && (sidebarOpen ? sidebarWidthClass : collapsedSidebarWidthClass)
        )}
      >
        <Sidebar
          onCloseSidebar={() => setSidebarOpen(false)}
          toggleSidebar={toggleSidebar}
          isOpen={sidebarOpen}
        />
      </div>

      <div
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300",
          isMobile ? "pb-16" : "",
          !isMobile && (sidebarOpen ? `md:ml-64` : `md:ml-16`)
        )}
      >
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="fixed top-4 left-4 z-50 lg:hidden bg-background/70 backdrop-blur-sm"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        )}
        
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {!isMobile && <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />}
              <div className="animate-fadeIn mt-4 md:mt-0">{children}</div>
            </div>
          </div>
        </BackgroundPattern>
      </div>

      {isMobile && !isLoading && (isTeacher || isAdmin) && (
        <BottomNavigation />
      )}
    </div>
  );
};
