
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherDashboard } from "@/components/teacher-portal/TeacherDashboard";
import { useToast } from "@/components/ui/use-toast";
import { LoadingState } from "@/components/teacher-portal/LoadingState";
import { AccessDenied } from "@/components/teacher-portal/AccessDenied";
import { ProfileNotFound } from "@/components/teacher-portal/ProfileNotFound";
import { Teacher } from "@/types/teacher";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";

const TeacherPortal = () => {
  const { session, refreshSession } = useAuth();
  const { toast } = useToast();
  const { isTeacher, isLoading: isRoleLoading } = useRBAC();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Use RBAC hook to check role, and also verify teacher profile exists
  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!session?.user?.email) {
        setIsCheckingRole(false);
        return;
      }
      
      try {
        setIsCheckingRole(true);
        // Additional check will happen in useQuery below
      } finally {
        setIsCheckingRole(false);
      }
    };
    
    checkTeacherStatus();
  }, [session]);

  const { 
    data: teacherData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['teacher-profile', session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, subject, experience, email, bio, phone')
        .eq('email', session.user.email)
        .single();
      
      if (error) {
        console.error('Error fetching teacher profile:', error);
        throw error;
      }
      
      return data as Teacher;
    },
    enabled: !!session?.user?.email && isTeacher === true && !isRoleLoading,
    retry: 1,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const handleRefresh = async () => {
    await refreshSession();
    refetch();
  };

  if (error) {
    console.error("Error loading teacher profile:", error);
    toast({
      title: "Error loading profile",
      description: "Could not load your teacher profile. Please try again later.",
      variant: "destructive"
    });
  }

  return (
    <DashboardLayout>
      {(isLoading || isCheckingRole || isRoleLoading) ? (
        <LoadingState />
      ) : !isTeacher ? (
        <AccessDenied />
      ) : !teacherData && !isLoading ? (
        <div className="space-y-4">
          <ProfileNotFound />
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleRefresh} className="mt-4">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      ) : (
        teacherData && <TeacherDashboard teacher={teacherData} />
      )}
    </DashboardLayout>
  );
};

export default TeacherPortal;
