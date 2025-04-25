
import { Sidebar } from "./Sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "./dashboard/LoadingSpinner";
import { BackgroundPattern } from "./dashboard/BackgroundPattern";
import { RoleBadge } from "./dashboard/RoleBadge";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className={`flex h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
        <Sidebar />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      <Sidebar />
      <BackgroundPattern isAdmin={isAdmin}>
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />
            <div className="animate-fadeIn">{children}</div>
          </div>
        </div>
      </BackgroundPattern>
    </div>
  );
};

