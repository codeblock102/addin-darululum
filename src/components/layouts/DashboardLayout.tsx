
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
          ? "bg-[#131720] bg-opacity-95 backdrop-blur-xl text-white" 
          : "bg-background"
      }`}>
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {!isLoading && (
              <div className={`absolute top-2 right-4 px-3 py-1 text-xs font-medium rounded-full backdrop-blur-md ${
                isAdmin 
                  ? "bg-amber-500/90 text-black" 
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
