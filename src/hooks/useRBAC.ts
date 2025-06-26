import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";

interface UserRole {
  role: string | null;
  teacher_id: string | null;
}

export const useRBAC = () => {
  const { session } = useAuth();

  const { data: userRole, isLoading } = useQuery<UserRole | null>({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async (): Promise<UserRole | null> => {
      if (!session?.user?.id) {
        return null;
      }

      // 1. Check auth metadata first for a quick role check
      const authRole = session.user.user_metadata?.role;
      if (authRole) {
        return { role: authRole, teacher_id: session.user.id };
      }

      // 2. If no role in metadata, query the profiles table
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile for RBAC:", error);
        return null;
      }

      return {
        role: profile.role,
        teacher_id: profile.id, // The profile ID is the teacher ID
      };
    },
    enabled: !!session?.user?.id,
  });

  const isAdmin = userRole?.role === "admin";
  const isTeacher = userRole?.role === "teacher";
  const teacherId = userRole?.teacher_id;

  console.log("RBAC Hook - Role:", userRole?.role, "Admin:", isAdmin, "Teacher:", isTeacher, "Teacher ID:", teacherId);

  return {
    isAdmin,
    isTeacher,
    teacherId,
    role: userRole?.role,
    isLoading,
  };
};
