
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
import { useRBAC } from "@/hooks/useRBAC";

const TeacherPortal = () => {
  const { session, refreshSession } = useAuth();
  const { toast } = useToast();
  const { isTeacher, isAdmin, isLoading: isRoleLoading } = useRBAC();
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Add a key to force refresh

  // Force a check for teacher profile on mount and when refreshKey changes
  useEffect(() => {
    const checkTeacherProfile = async () => {
      if (!session?.user?.email) {
        setIsCheckingRole(false);
        return;
      }
      
      try {
        setIsCheckingRole(true);
        console.log("Checking teacher status for email:", session.user.email);
        
        // Explicitly check if a teacher profile exists in the database
        const { data, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', session.user.email)
          .maybeSingle();
          
        if (error) throw error;
        
        console.log("Teacher profile check result:", data ? "Found" : "Not found");
        
        // Force refetch of the query
        if (data) {
          refetch();
        }
      } catch (error) {
        console.error("Error checking teacher profile:", error);
      } finally {
        setIsCheckingRole(false);
      }
    };
    
    checkTeacherProfile();
  }, [session, refreshKey]);

  const { 
    data: teacherData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['teacher-profile', session?.user?.email, refreshKey],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      
      console.log("Fetching teacher profile for email:", session.user.email);
      
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, subject, experience, email, bio, phone')
        .eq('email', session.user.email)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching teacher profile:', error);
        throw error;
      }
      
      console.log("Teacher profile fetch result:", data);
      return data as Teacher | null;
    },
    enabled: !!session?.user?.email,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false // Disable automatic refetch on window focus
  });

  const handleRefresh = async () => {
    console.log("Refreshing teacher data...");
    await refreshSession();
    setRefreshKey(prev => prev + 1); // Force a refresh of the query
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

  // Show loading state while checking roles or fetching teacher data
  if (isLoading || isCheckingRole || isRoleLoading) {
    return (
      <DashboardLayout>
        <LoadingState />
      </DashboardLayout>
    );
  }

  // Show profile not found if teacher data is missing, regardless of RBAC role
  // This will help with cases where a user might be assigned a teacher role but doesn't have a profile yet
  if (!teacherData) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <ProfileNotFound 
            email={session?.user?.email} 
            onRefresh={handleRefresh} 
          />
        </div>
      </DashboardLayout>
    );
  }

  // Show teacher dashboard if we have teacher data
  return (
    <DashboardLayout>
      {teacherData && <TeacherDashboard teacher={teacherData} />}
    </DashboardLayout>
  );
};

export default TeacherPortal;
