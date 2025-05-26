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
import { Shield } from "lucide-react";

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
        
        // Skip this check for admin users
        if (isAdmin) {
          console.log("User is admin, skipping teacher profile check");
          setIsCheckingRole(false);
          return;
        }
        
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
  }, [session, refreshKey, isAdmin]);

  const { 
    data: teacherData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['teacher-profile', session?.user?.email, refreshKey],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      
      // Skip the query for admin users
      if (isAdmin) {
        console.log("Admin user, skipping teacher profile query");
        return null;
      }
      
      console.log("Fetching teacher profile for email:", session.user.email);
      
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, subject, email, bio, phone')
        .eq('email', session.user.email)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching teacher profile:', error);
        throw error;
      }
      
      console.log("Teacher profile fetch result:", data);
      return data as Teacher | null;
    },
    enabled: !!session?.user?.email && !isAdmin, // Only enabled for non-admin users
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
  if ((isLoading || isCheckingRole || isRoleLoading) && !isAdmin) {
    return (
      <DashboardLayout>
        <LoadingState />
      </DashboardLayout>
    );
  }

  // If user is admin, they should be able to view the teacher portal with a generic profile
  if (isAdmin) {
    // Create a temporary teacher profile for admin view
    const adminViewProfile: Teacher = {
      id: 'admin-view',
      name: 'Admin View',
      subject: 'Administration',
      email: session?.user?.email || 'admin@example.com',
      bio: 'Viewing the teacher portal as an administrator',
      phone: ''
    };
    
    return (
      <DashboardLayout>
        <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-md flex items-center">
          <Shield className="text-blue-600 mr-3 h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            <strong>Admin Mode:</strong> You are viewing the teacher portal with administrator privileges. 
            Some teacher-specific features may require a teacher profile.
          </p>
        </div>
        <TeacherDashboard teacher={adminViewProfile} />
      </DashboardLayout>
    );
  }

  // Show profile not found if teacher data is missing (for non-admin users)
  if (!teacherData) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <ProfileNotFound 
            email={session?.user?.email} 
            onRefresh={handleRefresh}
            isAdmin={isAdmin}
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
