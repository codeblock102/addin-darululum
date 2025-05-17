
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
        
        // First, try to get role from user metadata (most reliable source)
        let userRole = session.user.user_metadata?.role as UserRole || null;
        console.log("User role from metadata:", userRole);
        
        if (!userRole) {
          // Second, check user_roles table via RPC function
          const { data: userRoleData, error: userRoleError } = await supabase.rpc(
            'get_user_role_id',
            { user_id: session.user.id }
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
          } else {
            console.log("No role found in user_roles table, checking teacher association");
            
            // Third, check if user is associated with a teacher
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('id')
              .eq('email', session.user.email)
              .maybeSingle();
            
            if (teacherData) {
              userRole = 'teacher';
              console.log("Role determined by teacher association: teacher");
            } else {
              // Default fallback
              userRole = 'admin';
              console.log("No roles found, defaulting to: admin");
            }
          }
        }
        
        setRole(userRole);
        
        // Fetch user permissions
        const userPermissions = await getUserPermissions();
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
    permissions, 
    hasPermission, 
    isLoading 
  };
};
