
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

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return {};
      }

      let result: UserRole = {
        role: profile?.role || undefined,
      };

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

      console.log("User role data:", result);
      return result;
    },
    enabled: !!session?.user?.email,
  });

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
