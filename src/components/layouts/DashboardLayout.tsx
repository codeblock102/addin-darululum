
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "./dashboard/LoadingSpinner";
import { BackgroundPattern } from "./dashboard/BackgroundPattern";
import { RoleBadge } from "./dashboard/RoleBadge";
import { SidebarUser } from "./sidebar/SidebarUser";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAdmin, isTeacher, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className={`flex h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      {isAdmin && (
        <div className="flex h-screen">
          <div className="w-64 bg-[#131724] border-r border-white/5 text-white">
            <SidebarUser isAdmin={isAdmin} />
          </div>
          <div className="flex-1 overflow-auto">
            <BackgroundPattern isAdmin={isAdmin}>
              <div className="p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                  <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />
                  <div className="animate-fadeIn">{children}</div>
                </div>
              </div>
            </BackgroundPattern>
          </div>
        </div>
      )}
      
      {!isAdmin && (
        <BackgroundPattern isAdmin={isAdmin}>
          <div className="flex flex-col h-screen">
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t z-10 md:hidden">
              <SidebarUser isAdmin={isAdmin} />
            </div>
            <div className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                  <div className="md:hidden mb-4">
                    <RoleBadge isAdmin={isAdmin} isLoading={isLoading} />
                  </div>
                  <div className="animate-fadeIn">{children}</div>
                </div>
              </div>
            </div>
          </div>
        </BackgroundPattern>
      )}
    </div>
  );
};
