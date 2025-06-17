
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { hasPermission as checkPermission, RolePermission } from "@/utils/roleUtils";

interface UserRole {
  role?: string;
  teacher_id?: string;
}

export const useRBAC = () => {
  const { session } = useAuth();

  const { data: userRole, isLoading } = useQuery<UserRole>({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.email) return {};

      console.log("Fetching user role for email:", session.user.email);

      // Check user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", session.user.email)
        .maybeSingle();


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

      // If user is a teacher, get their teacher ID
      if (profile?.role === "teacher") {
        const { data: teacherProfile, error: teacherError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", session.user.email)
          .eq("role", "teacher")
          .maybeSingle();

        if (teacherError) {
          console.error("Error fetching teacher profile:", teacherError);
        } else if (teacherProfile) {
          result.teacher_id = teacherProfile.id;
        }
      }


    fetchRoleAndPermissions();
  }, [session]); // Remove role from dependencies to prevent loops

  const isAdmin = userRole?.role === "admin";
  const isTeacher = userRole?.role === "teacher";
  const teacherId = userRole?.teacher_id;

  // Add hasPermission function
  const hasPermission = async (permission: RolePermission): Promise<boolean> => {
    try {
      return await checkPermission(permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  };

  console.log("RBAC Hook - Role:", userRole?.role, "Admin:", isAdmin, "Teacher:", isTeacher, "Teacher ID:", teacherId);

  return {
    isAdmin,
    isTeacher,
    teacherId,
    role: userRole?.role,
    isLoading,
    hasPermission,
  };
};
