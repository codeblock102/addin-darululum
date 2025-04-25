
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user?.email) {
        setIsAdmin(true);
        setIsTeacher(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
        
        setIsTeacher(teacherData && teacherData.length > 0);
        setIsAdmin(!teacherData || teacherData.length === 0);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking user role:", error);
        setIsAdmin(true);
        setIsTeacher(false);
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [session]);

  return (
    <div className={`flex h-screen w-full ${isAdmin ? "admin-theme" : "teacher-theme"}`}>
      <Sidebar />
      <div className={`flex flex-col flex-1 overflow-auto transition-all duration-300 ${
        isAdmin 
          ? "bg-gradient-to-br from-[#131720] to-[#1A1F2C] text-white" 
          : "bg-background"
      }`}
      style={{
        backgroundImage: isAdmin ? "url('data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%232A3042' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E')" : "none"
      }}>
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {!isLoading && (
              <div className={`absolute top-2 right-4 px-3 py-1 text-xs font-medium rounded-full backdrop-blur-xl ${
                isAdmin 
                  ? "bg-amber-500/90 text-black shadow-lg" 
                  : "bg-emerald-500/90 text-white"
              }`}>
                {isAdmin ? "ADMIN" : "TEACHER"}
              </div>
            )}
            <div className="animate-fadeIn">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
