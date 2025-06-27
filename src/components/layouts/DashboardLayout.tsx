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
  const { isAdmin, isTeacher, isLoading } = useRBAC();
  const { setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    const root = document.documentElement;
    if (isTeacher && !isAdmin) {
      root.classList.remove("dark");
      root.classList.add("teacher-theme");
      setTheme("light");
    } else if (isAdmin) {
      root.classList.remove("teacher-theme");
      root.classList.add("dark");
      setTheme("dark");
    }
  }, [isAdmin, isTeacher, setTheme]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

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
    <div
      className={cn(
        "flex min-h-screen w-full overflow-hidden",
        isAdmin ? "admin-theme" : "teacher-theme",
      )}
    >
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background border-r",
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

      <div
        className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto transition-all duration-300",
          isMobile ? "pb-16" : "",
          !isMobile && (sidebarOpen ? `md:ml-64` : `md:ml-16`),
        )}
      >
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {!isMobile && (
                <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />
              )}
              <div className="animate-fadeIn mt-4 md:mt-0">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </BackgroundPattern>
      </div>

      {isMobile && !isLoading && (isTeacher || isAdmin) && <BottomNavigation />}
    </div>
  );
};
