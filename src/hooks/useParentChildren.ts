import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";

export interface ParentChildLink {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
}

export interface ParentChildStudent {
  id: string;
  name: string;
  guardian_name?: string | null;
  guardian_contact?: string | null;
  status?: string | null;
}

export const useParentChildren = () => {
  const { session } = useAuth();
  const parentId = session?.user?.id;

  const { data: children, isLoading, error, refetch } = useQuery<ParentChildStudent[] | null>({
    queryKey: ["parent-children", parentId],
    queryFn: async () => {
      if (!parentId) return [];

      // Get linked student IDs from consolidated parents table
      const { data: links, error: linkError } = await (supabase as any)
        .from("parents")
        .select("id, student_ids")
        .eq("id", parentId);

      if (linkError) {
        console.error("Error fetching parents:", linkError);
        throw linkError;
      }

      // Auto-provision an empty parents row if missing
      if (!links || links.length === 0) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, name, email, madrassah_id")
            .eq("id", parentId)
            .maybeSingle();

          await (supabase as any)
            .from("parents")
            .upsert({
              id: parentId,
              name: profile?.name || (session?.user?.user_metadata?.name as string) || "Parent",
              email: (profile as any)?.email || (session?.user?.email as string) || "",
              madrassah_id: (profile as any)?.madrassah_id || null,
              student_ids: [],
            });
        } catch (e) {
          console.warn("Auto-provision parents row failed (non-fatal):", e);
        }
        return [];
      }

      const studentIds = (links || [])
        .flatMap((l: any) => (l.student_ids ?? []))
        .filter(Boolean);
      if (studentIds.length === 0) return [];

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, name, guardian_name, guardian_contact, status")
        .in("id", studentIds as string[]);

      if (studentsError) {
        console.error("Error fetching students for parent:", studentsError);
        throw studentsError;
      }

      return (students || []) as ParentChildStudent[];
    },
    enabled: !!parentId,
  });

  return { children: children || [], isLoading, error, refetch };
};


