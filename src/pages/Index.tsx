
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";

const Index = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email);
          
        if (error) throw error;
        
        setIsTeacher(data && data.length > 0);
      } catch (error) {
        console.error("Error checking teacher status:", error);
        setIsTeacher(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  useEffect(() => {
    if (isTeacher === true && !isLoading) {
      navigate('/teacher-portal');
    }
  }, [isTeacher, isLoading, navigate]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (isTeacher) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <p>Redirecting to teacher portal...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <WelcomeHeader />
        <DashboardStats />
        <DashboardTabs />
      </div>
    </DashboardLayout>
  );
};

export default Index;
