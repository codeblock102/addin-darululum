
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "./dashboard/LoadingSpinner";
import { BackgroundPattern } from "./dashboard/BackgroundPattern";
import { RoleBadge } from "./dashboard/RoleBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isLoading } = useUserRole();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  if (isLoading) {
    return (
      <div className={`flex h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
        {sidebarOpen && <Sidebar />}
        <LoadingSpinner />
      </div>
    );
  }

  const bulgeColor = isAdmin ? "bg-primary/90" : "bg-[#9b87f5]";

  return (
    <div className={`flex min-h-screen w-full overflow-hidden ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      {/* Sidebar with conditional display on mobile */}
      <div className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-300 ease-in-out
        fixed inset-y-0 left-0 z-40 w-64 lg:relative lg:translate-x-0
      `}>
        <Sidebar onCloseSidebar={() => setSidebarOpen(false)} toggleSidebar={toggleSidebar} />
      </div>
      
      {/* Toggle button "bulge" that's always visible on mobile - even when sidebar is closed */}
      {isMobile && !sidebarOpen && (
        <Button 
          variant="ghost" 
          size="icon" 
          className={`fixed top-3 left-0 z-50 rounded-r-md rounded-l-none border-l-0 shadow-md ${bulgeColor} text-white`}
          onClick={toggleSidebar}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      
      <div className={`flex-1 overflow-hidden ${isMobile ? "pt-16 pb-20" : ""}`}>
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
