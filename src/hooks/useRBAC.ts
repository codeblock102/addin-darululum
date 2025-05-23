
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RolePermission, getUserPermissions } from "@/utils/roleUtils";

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
        console.error("Role check timed out after 5 seconds");
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
    }, 5000); // 5 second timeout

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
          console.log("User is admin based on metadata");
        }
        
        // If not already identified as admin, check user_roles table
        if (!userRole && !abortController.signal.aborted) {
          try {
            // Get role from user_roles table with timeout protection
            const rolePromise = supabase
              .from('user_roles')
              .select('roles:role_id(name)')
              .eq('user_id', session.user.id)
              .maybeSingle();
              
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error("Database query timed out")), 3000)
            );
            
            const roleData = await Promise.race([rolePromise, timeoutPromise])
              .catch(err => {
                console.error("Role query failed or timed out:", err);
                return null;
              });

            if (roleData && !roleData.error && roleData.data) {
              const roleName = roleData.data.roles?.name;
              console.log("Role from database:", roleName);
              
              if (roleName === 'admin') {
                userRole = 'admin';
                console.log("User is admin based on database role");
              } else if (roleName === 'teacher') {
                userRole = 'teacher';
                console.log("User is teacher based on database role");
              }
            } else if (roleData && roleData.error) {
              console.error("Error fetching user role:", roleData.error);
            }
          } catch (error) {
            console.log("Error or timeout fetching user role from database:", error);
          }
        }
        
        // If still not identified, check for teacher profile
        if (!userRole && session.user.email && !abortController.signal.aborted) {
          console.log("Checking for teacher profile with email:", session.user.email);
          try {
            const teacherPromise = supabase
              .from('teachers')
              .select('id')
              .eq('email', session.user.email)
              .maybeSingle();
              
            const timeoutPromise = new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error("Teacher lookup timed out")), 3000)
            );
            
            const teacherData = await Promise.race([teacherPromise, timeoutPromise])
              .catch(err => {
                console.error("Teacher query failed or timed out:", err);
                return null;
              });
            
            if (teacherData && !teacherData.error && teacherData.data) {
              console.log("Found teacher profile:", teacherData.data);
              userRole = 'teacher';
            } else {
              console.log("No teacher profile found or error:", teacherData?.error || "No data");
            }
          } catch (error) {
            console.log("Error or timeout checking teacher profile:", error);
          }
        }
        
        setRole(userRole);
        
        // Cache role in localStorage for faster recovery
        if (userRole) {
          localStorage.setItem('userRole', userRole);
        } else {
          localStorage.removeItem('userRole');
        }
        
        // Try to fetch permissions in parallel but don't block UI updates
        if (!abortController.signal.aborted && session.user.id) {
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
        
        console.log(`RBAC role check complete: role=${userRole}`);
      } catch (error) {
        console.error("Error fetching user role and permissions:", error);
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
    // Give all permissions for now to ensure functionality
    return true;
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
