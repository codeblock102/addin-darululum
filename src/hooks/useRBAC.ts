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

      if (!error && profile) {
        return {
          role: profile.role,
          teacher_id: profile.id, // The profile ID is the teacher ID
        };
      }

      // 3. Check parents for parent role by auth user id
      const { data: parentRow, error: parentError } = await supabase
        .from("parents")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (parentError) {
        console.error("Error fetching parent_teachers for RBAC:", parentError);
        return null;
      }

      if (parentRow?.id) {
        return { role: "parent", teacher_id: null } as unknown as UserRole;
      }

      return null;
    },
    enabled: !!session?.user?.id,
  });

  const isAdmin = userRole?.role === "admin";
  const isTeacher = userRole?.role === "teacher";
  const isParent = userRole?.role === "parent";
  const teacherId = userRole?.teacher_id;

  console.log(
    "RBAC Hook - Role:",
    userRole?.role,
    "Admin:",
    isAdmin,
    "Teacher:",
    isTeacher,
    "Parent:",
    isParent,
    "Teacher ID:",
    teacherId,
  );

  return {
    isAdmin,
    isTeacher,
    isParent,
    teacherId,
    role: userRole?.role,
    isLoading,
  };
};
