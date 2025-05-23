
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RolePermission } from "@/utils/roleUtils";

export type UserRole = 'admin' | 'teacher' | 'student';

export const useRBAC = () => {
  const { session } = useAuth();
  const [role, setRole] = useState<UserRole | null>(() => {
    // Try to get cached role from localStorage first for immediate response
    const cachedRole = localStorage.getItem('userRole') as UserRole | null;
    return cachedRole;
  });
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create an abort controller for timeout handling
    const abortController = new AbortController();
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Role check timed out after 2 seconds");
        setIsLoading(false);
        setError("Role check timed out");
        abortController.abort();
        
        // If we have a cached role, use that
        const cachedRole = localStorage.getItem('userRole') as UserRole | null;
        if (cachedRole && !role) {
          console.log("Using cached role from localStorage:", cachedRole);
          setRole(cachedRole);
        }
      }
    }, 2000); // Shorter 2 second timeout for better UX

    const fetchRoleAndPermissions = async () => {
      if (!session) {
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        localStorage.removeItem('userRole'); // Clear cached role if no session
        return;
      }

      try {
        setIsLoading(true);
        let userRole: UserRole | null = null;
        
        // First, check if user has admin role from metadata (fastest method)
        const isUserAdmin = session.user.user_metadata?.role === 'admin';
        if (isUserAdmin) {
          userRole = 'admin';
          localStorage.setItem('userRole', userRole);
          console.log("User is admin based on metadata");
        }
        
        // Skip database calls if admin is already determined from metadata
        if (!userRole && !abortController.signal.aborted) {
          // Check for teacher profile (only if not already determined to be admin)
          if (session.user.email && !abortController.signal.aborted) {
            console.log("Checking for teacher profile with email:", session.user.email);
            try {
              const { data: teacherData, error } = await supabase
                .from('teachers')
                .select('id')
                .eq('email', session.user.email)
                .maybeSingle();
              
              if (teacherData) {
                console.log("Found teacher profile:", teacherData);
                userRole = 'teacher';
                localStorage.setItem('userRole', userRole);
              } else {
                console.log("No teacher profile found or error:", error?.message || "No data");
              }
            } catch (error) {
              console.log("Error checking teacher profile:", error);
            }
          }
        }
        
        setRole(userRole);
        console.log(`RBAC role check complete: role=${userRole}`);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setError("Failed to check user permissions");
      } finally {
        // Only set loading to false if we haven't aborted
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchRoleAndPermissions();

    // Clean up function
    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [session, role]);

  const hasPermission = (requiredPermission: RolePermission): boolean => {
    // Give all permissions to admins
    if (role === 'admin') return true;
    
    // Check if the permission is in the permissions array
    return permissions.includes(requiredPermission);
  };

  return { 
    role, 
    isAdmin: role === 'admin', 
    isTeacher: role === 'teacher' || role === 'admin',
    isStudent: role === 'student',
    permissions, 
    hasPermission, 
    isLoading,
    error
  };
};
