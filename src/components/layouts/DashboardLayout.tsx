import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar.tsx";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { LoadingSpinner } from "./dashboard/LoadingSpinner.tsx";
import { BackgroundPattern } from "./dashboard/BackgroundPattern.tsx";
import { RoleBadge } from "./dashboard/RoleBadge.tsx";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { BottomNavigation } from "@/components/mobile/BottomNavigation.tsx";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { useTheme } from "@/hooks/use-theme.ts";

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isParent, isLoading } = useRBAC();
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    const root = document.documentElement;
    if ((isTeacher || isParent) && !isAdmin) {
      root.classList.remove("dark");
      root.classList.add("teacher-theme");
      setTheme("light");
    } else if (isAdmin) {
      root.classList.remove("teacher-theme");
      root.classList.add("dark");
      setTheme("dark");
    }
  }, [isAdmin, isTeacher, isParent, setTheme]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] via-[hsl(142.8,64.2%,20%)] to-[hsl(142.8,64.2%,16%)]">
        <LoadingSpinner />
      </div>
    );
  }

  const sidebarWidthClass = "w-64";
  const collapsedSidebarWidthClass = "md:w-16";

  return (
    <div
      className={cn(
        "flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-[hsl(142.8,64.2%,24.1%)] via-[hsl(142.8,64.2%,20%)] to-[hsl(142.8,64.2%,16%)]",
        isAdmin ? "admin-theme" : "teacher-theme",
      )}
    >
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white/95 backdrop-blur-xl border-r border-white/20 shadow-2xl",
          isMobile ? `${sidebarWidthClass} -translate-x-full` : [
            sidebarOpen ? sidebarWidthClass : collapsedSidebarWidthClass,
            "transition-all duration-300 ease-in-out",
          ],
        )}
      >
        <Sidebar
          onCloseSidebar={() => setSidebarOpen(false)}
          toggleSidebar={toggleSidebar}
          isOpen={sidebarOpen}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 overflow-x-hidden transition-all duration-300",
          isMobile ? "pb-20" : "", // Increased bottom padding for mobile
          !isMobile && (sidebarOpen ? `md:ml-64` : `md:ml-16`),
        )}
      >
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="p-3 sm:p-4 md:p-6 h-full">
            <div className="max-w-7xl mx-auto h-full">
              {/* Role Badge - Hidden on mobile for cleaner look */}
              {!isMobile && (
                <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />
              )}
              
              {/* Main Content with enhanced mobile spacing */}
              <div className="animate-fadeIn mt-2 sm:mt-4 md:mt-0 h-full">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </BackgroundPattern>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && !isLoading && (isTeacher || isAdmin || isParent) && (
        <BottomNavigation />
      )}
    </div>
  );
};
