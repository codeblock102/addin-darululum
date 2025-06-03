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
import { useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isLoading } = useRBAC();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const location = useLocation();
  
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

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
          "fixed inset-y-0 left-0 z-40 bg-background border-r",
          isMobile ? 
            `${sidebarWidthClass} -translate-x-full`
            : 
            [
              (sidebarOpen ? sidebarWidthClass : collapsedSidebarWidthClass),
              "transition-all duration-300 ease-in-out"
            ]
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
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {!isMobile && <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />}
              <div className="animate-fadeIn mt-4 md:mt-0">
                <Outlet />
              </div>
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
