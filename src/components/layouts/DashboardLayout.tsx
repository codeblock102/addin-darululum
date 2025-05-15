
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "./dashboard/LoadingSpinner";
import { BackgroundPattern } from "./dashboard/BackgroundPattern";
import { RoleBadge } from "./dashboard/RoleBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

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

  return (
    <div className={`flex min-h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      {/* Mobile sidebar toggle button */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-50 lg:hidden"
          onClick={toggleSidebar}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      )}
      
      {/* Sidebar with conditional display on mobile */}
      <div className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        transition-transform duration-300 ease-in-out
        fixed inset-y-0 left-0 z-40 w-64 lg:relative lg:translate-x-0
      `}>
        <Sidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>
      
      <div className={`flex-1 ${isMobile ? "pt-16" : ""}`}>
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="p-3 sm:p-4 md:p-6">
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
