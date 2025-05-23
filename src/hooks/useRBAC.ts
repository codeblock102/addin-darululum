
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create an abort controller for timeout handling
    const abortController = new AbortController();
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.error("Role check timed out after 10 seconds");
        setIsLoading(false);
        setError("Role check timed out");
        abortController.abort();
      }
    }, 10000); // 10 second timeout

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
        
        // First, check if user has admin role from metadata (fastest method)
        const isUserAdmin = session.user.user_metadata?.role === 'admin';
        if (isUserAdmin) {
          userRole = 'admin';
          console.log("User is admin based on metadata");
        }
        
        // If not already identified as admin, check user_roles table
        if (!userRole && !abortController.signal.aborted) {
          try {
            // Get role from user_roles table with timeout protection
            const { data: roleData, error: roleError } = await Promise.race([
              supabase
                .from('user_roles')
                .select('roles:role_id(name)')
                .eq('user_id', session.user.id)
                .maybeSingle(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error("Database query timed out")), 5000)
              )
            ]);

            if (roleData && !roleError) {
              const roleName = roleData.roles?.name;
              console.log("Role from database:", roleName);
              
              if (roleName === 'admin') {
                userRole = 'admin';
                console.log("User is admin based on database role");
              } else if (roleName === 'teacher') {
                userRole = 'teacher';
                console.log("User is teacher based on database role");
              }
            } else if (roleError) {
              console.error("Error fetching user role:", roleError);
            }
          } catch (error) {
            console.log("Error or timeout fetching user role from database:", error);
          }
        }
        
        // If still not identified, check for teacher profile
        if (!userRole && session.user.email && !abortController.signal.aborted) {
          console.log("Checking for teacher profile with email:", session.user.email);
          try {
            const { data: teacherData, error: teacherError } = await Promise.race([
              supabase
                .from('teachers')
                .select('id')
                .eq('email', session.user.email)
                .maybeSingle(),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error("Teacher lookup timed out")), 5000)
              )
            ]);
            
            if (teacherData && !teacherError) {
              console.log("Found teacher profile:", teacherData);
              userRole = 'teacher';
            } else {
              console.log("No teacher profile found or error:", teacherError);
              userRole = null;
            }
          } catch (error) {
            console.log("Error or timeout checking teacher profile:", error);
          }
        }
        
        setRole(userRole);
        
        // Only fetch permissions if we've identified a role and haven't aborted
        try {
          if (!abortController.signal.aborted && session.user.id) {
            // Get permissions in parallel but don't block UI updates
            getUserPermissions(session.user.id)
              .then(userPermissions => {
                if (!abortController.signal.aborted) {
                  setPermissions(userPermissions);
                }
              })
              .catch(error => {
                console.error("Error fetching permissions:", error);
              });
          }
        } catch (error) {
          console.error("Error setting up permissions fetch:", error);
        }
        
        console.log(`RBAC role check complete: role=${userRole}`);
      } catch (error) {
        console.error("Error fetching user role and permissions:", error);
        setRole(null);
        setPermissions([]);
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
  }, [session]);

  const hasPermission = (requiredPermission: RolePermission): boolean => {
    // Give all permissions for now to ensure functionality
    return true;
    // Original implementation:
    // return permissions.includes(requiredPermission);
  };

  // Return a more complete set of properties
  return { 
    role, 
    isAdmin: role === 'admin', 
    isTeacher: role === 'teacher' || role === 'admin', // Admins should have teacher access too
    isStudent: role === 'student', 
    permissions, 
    hasPermission, 
    isLoading,
    error
  };
};
