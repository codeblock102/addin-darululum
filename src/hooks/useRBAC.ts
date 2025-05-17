
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
        
        // First, check if user has a teacher profile - this should take priority
        if (session.user.email) {
          console.log("Checking for teacher profile with email:", session.user.email);
          const { data: teacherData, error: teacherError } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', session.user.email)
            .maybeSingle();
          
          if (teacherData && !teacherError) {
            console.log("Found teacher profile:", teacherData);
            setRole('teacher');
            
            // Fetch user permissions
            const userPermissions = await getUserPermissions(session.user.id);
            setPermissions(userPermissions);
            setIsLoading(false);
            return; // Exit early since we've confirmed teacher role
          } else {
            console.log("No teacher profile found or error:", teacherError);
          }
        }
        
        // If not a teacher, try to get role from user metadata (second priority)
        let userRole = session.user.user_metadata?.role as UserRole || null;
        console.log("User role from metadata:", userRole);
        
        if (!userRole) {
          // Third, check user_roles table via RPC function
          const { data: userRoleData, error: userRoleError } = await supabase.rpc(
            'get_user_role_id',
            { p_user_id: session.user.id }
          );
          
          if (userRoleData && !userRoleError) {
            // If we found a role ID, get its name
            const { data: roleData } = await supabase
              .from('roles')
              .select('name')
              .eq('id', userRoleData)
              .single();
              
            if (roleData) {
              userRole = roleData.name as UserRole;
              console.log("Role from database:", roleData.name);
            }
          }
        }
        
        // Set a default role if none found
        if (!userRole) {
          userRole = 'admin'; // Default to admin as fallback
          console.log("No role found, defaulting to:", userRole);
        }
        
        setRole(userRole);
        
        // Fetch user permissions
        const userPermissions = await getUserPermissions(session.user.id);
        setPermissions(userPermissions);
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
    return permissions.includes(requiredPermission);
  };

  return { 
    role, 
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isStudent: role === 'student', 
    permissions, 
    hasPermission, 
    isLoading 
  };
};
