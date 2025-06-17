import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { RolePermission } from "@/utils/roleUtils.ts";

export type UserRole = "admin" | "teacher" | "student";

export const useRBAC = () => {
  const { session } = useAuth();
  const [role, setRole] = useState<UserRole | null>(() => {
    // Try to get cached role from localStorage first for immediate response
    const cachedRole = localStorage.getItem("userRole") as UserRole | null;
    console.log("useRBAC initial from localStorage:", cachedRole);
    return cachedRole;
  });
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      if (!session) {
        setRole(null);
        setPermissions([]);
        setIsLoading(false);
        localStorage.removeItem("userRole"); // Clear cached role if no session
        return;
      }

      try {
        setIsLoading(true);
        let userRole: UserRole | null = null;

        // First, check if user has admin role from metadata (fastest method)
        console.log(
          "Checking user metadata for role:",
          session.user.user_metadata,
        );
        const isUserAdmin = session.user.user_metadata?.role === "admin";
        if (isUserAdmin) {
          userRole = "admin";
          localStorage.setItem("userRole", userRole);
          console.log("User is admin based on metadata");
          setRole(userRole);
          setIsLoading(false);
          return; // Exit early if admin role is confirmed
        }

        // If not admin in metadata, check profiles table
        if (session.user.email) {
          console.log(
            "Checking for profile with email:",
            session.user.email,
          );
          try {
            const { data: profileData, error } = await supabase
              .from("profiles")
              .select("id, role")
              .eq("email", session.user.email)
              .maybeSingle();

            if (profileData) {
              console.log("Found profile:", profileData);
              userRole = profileData.role as UserRole;
              localStorage.setItem("userRole", userRole);
            } else {
              console.log(
                "No profile found or error:",
                error?.message || "No data",
              );
              // If no role is found, clear any cached role
              localStorage.removeItem("userRole");
            }
          } catch (error) {
            console.log("Error checking profile:", error);
            // On error, clear any cached role
            localStorage.removeItem("userRole");
          }
        }

        setRole(userRole);
        console.log(`RBAC role check complete: role=${userRole}`);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setError("Failed to check user permissions");
        // On error, clear any cached role
        localStorage.removeItem("userRole");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoleAndPermissions();
  }, [session]); // Remove role from dependencies to prevent loops

  const hasPermission = (requiredPermission: RolePermission): boolean => {
    // Give all permissions to admins
    if (role === "admin") return true;

    // Check if the permission is in the permissions array
    return permissions.includes(requiredPermission);
  };

  return {
    role,
    isAdmin: role === "admin",
    isTeacher: role === "teacher" || role === "admin",
    isStudent: role === "student",
    permissions,
    hasPermission,
    isLoading,
    error,
  };
};
