import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useEffect } from "react";
import type { Json } from "@/integrations/supabase/types.ts";

interface UserRole {
  role: string | null;
  teacher_id: string | null;
  subject?: string | null;
  capabilities?: Json | null;
}

export const useRBAC = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: userRole, isLoading } = useQuery<UserRole | null>({
    queryKey: ["user-role", session?.user?.id],
    queryFn: async (): Promise<UserRole | null> => {
      if (!session?.user?.id) {
        return null;
      }

      // 1. Query the profiles table for role and capabilities
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role, subject, capabilities")
        .eq("id", session.user.id)
        .single();

      if (!error && profile) {
        return {
          role: profile.role,
          teacher_id: profile.id, // The profile ID is the teacher ID
          subject: profile.subject,
          capabilities: profile.capabilities,
        };
      }

      // 2. Check parents for parent role by auth user id
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

      // 3. Fallback to auth metadata role if present
      const authRole = session.user.user_metadata?.role;
      if (authRole) {
        return { role: authRole, teacher_id: session.user.id };
      }

      return null;
    },
    enabled: !!session?.user?.id,
  });

  const isAdmin = userRole?.role === "admin";
  const isTeacher = userRole?.role === "teacher";
  const isParent = userRole?.role === "parent";
  const teacherId = userRole?.teacher_id;
  // Attendance access driven by capability
  const capabilities: string[] = Array.isArray(userRole?.capabilities)
    ? (userRole?.capabilities as unknown as string[])
    : [];
  const hasCapability = (cap: string) => capabilities.includes(cap);
  const isAttendanceTaker = hasCapability("attendance_access");
  const isHifdhTeacher = (userRole?.subject || "").toLowerCase().includes("hifdh");

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

  // Live update attendance_taker changes for current user
  useEffect(() => {
    if (!teacherId) return;
    const channel = supabase
      .channel("rbac-profiles")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${teacherId}`,
        },
        () => {
          // Refetch RBAC when capabilities/role change
          queryClient.invalidateQueries({ queryKey: ["user-role", session?.user?.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId]);

  return {
    isAdmin,
    isTeacher,
    isParent,
    teacherId,
    isAttendanceTaker,
    isHifdhTeacher,
    hasCapability,
    role: userRole?.role,
    isLoading,
  };
};
