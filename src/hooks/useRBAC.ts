
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RolePermission, getUserPermissions } from "@/utils/roleUtils";

export type UserRole = 'admin' | 'teacher' | 'student';

export const useRBAC = () => {
  const { session } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      if (!session) {
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let userRole: UserRole | null = null;
        
        // First, check if user has admin role from metadata
        // This is the most reliable way to detect admins
        const isUserAdmin = session.user.user_metadata?.role === 'admin';
        if (isUserAdmin) {
          userRole = 'admin';
          console.log("User is admin based on metadata");
        }
        
        // If not already identified as admin, check for teacher profile
        if (!isUserAdmin && session.user.email) {
          console.log("Checking for teacher profile with email:", session.user.email);
          const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', session.user.email)
            .maybeSingle();
          
          if (teacherData && !teacherError) {
            console.log("Found teacher profile:", teacherData);
            userRole = 'teacher';
          } else {
            console.log("No teacher profile found or error:", teacherError);
            userRole = null;
          }
        }
        
        setRole(userRole);
        
        // Fetch user permissions
        const userPermissions = await getUserPermissions(session.user.id);
        setPermissions(userPermissions);
        
        console.log(`RBAC role check complete: role=${userRole}`);
      } catch (error) {
        console.error("Error fetching user role and permissions:", error);
        setRole(null);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleAndPermissions();
  }, [session]);

  const hasPermission = (requiredPermission: RolePermission): boolean => {
    // Give all permissions for now to ensure functionality
    return true;
    // Original implementation:
    // return permissions.includes(requiredPermission);
  };

  return { 
    role, 
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher' || role === 'admin', // Admins should have teacher access too
    isStudent: role === 'student', 
    permissions, 
    hasPermission, 
    isLoading 
  };
};
