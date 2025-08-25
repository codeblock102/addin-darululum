import { supabase } from "@/integrations/supabase/client.ts";

export type RolePermission =
  | "view_reports"
  | "export_reports"
  | "manage_students"
  | "manage_teachers"
  | "manage_schedules"
  | "manage_roles"
  | "bulk_actions"
  | "manage_classes";

/**
 * Check if the current user has a specific permission
 *
 * Note: The backend function has been updated to use a fixed search path
 * for improved security.
 */
export const hasPermission = async (
  requiredPermission: RolePermission,
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Determine role using auth metadata first, then profiles.role
    let role: string | null = session.user.user_metadata?.role ?? null;
    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      role = profile?.role ?? null;
    }

    if (!role) return false;

    // Admins have all permissions
    if (role === "admin") return true;

    // Define teacher permissions
    const teacherPermissions: Set<RolePermission> = new Set([
      "view_reports",
      "manage_students",
      "manage_schedules",
      "manage_classes",
    ]);

    if (role === "teacher") {
      return teacherPermissions.has(requiredPermission);
    }

    // Parents and others currently have no special permissions
    return false;
  } catch (error) {
    console.error("Unexpected error checking permission:", error);
    return false;
  }
};

/**
 * Get all permissions for the current user
 */
export const getUserPermissions = async (
  userId?: string,
): Promise<RolePermission[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const userIdToUse = userId || session.user.id;

    // Determine role using auth metadata first, then profiles.role
    let role: string | null = session.user.user_metadata?.role ?? null;
    if (!role || userIdToUse !== session.user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userIdToUse)
        .maybeSingle();
      role = profile?.role ?? role;
    }

    if (!role) return [];

    if (role === "admin") {
      return [
        "view_reports",
        "export_reports",
        "manage_students",
        "manage_teachers",
        "manage_schedules",
        "manage_roles",
        "bulk_actions",
        "manage_classes",
      ];
    }

    if (role === "teacher") {
      return [
        "view_reports",
        "manage_students",
        "manage_schedules",
        "manage_classes",
      ];
    }

    return [];
  } catch (error) {
    console.error("Unexpected error fetching permissions:", error);
    return [];
  }
};
