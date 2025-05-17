
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
        
        // First, try to get role from user metadata
        const userRole = session.user.user_metadata?.role as UserRole || null;
        
        if (userRole) {
          setRole(userRole);
        } else {
          // Fallback to checking if user is a teacher
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('id')
            .eq('email', session.user.email)
            .maybeSingle();
          
          setRole(teacherData ? 'teacher' : 'admin');
        }
        
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
