import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export interface StudentTeacher {
  id: string;
  name: string;
  className: string;
}

/**
 * Given a studentId, find their class(es) and the teacher(s) in those classes.
 * Returns: { data: StudentTeacher[], isLoading: boolean }
 */
export function useStudentTeacher(studentId: string | undefined) {
  return useQuery<StudentTeacher[]>({
    queryKey: ["student-teacher", studentId],
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        // 1. Get student's class_ids
        const { data: student } = await supabase
          .from("students")
          .select("class_ids")
          .eq("id", studentId!)
          .maybeSingle();
        if (!student?.class_ids?.length) return [];

        // 2. Get classes
        const { data: classes } = await supabase
          .from("classes")
          .select("id, name, teacher_ids")
          .in("id", student.class_ids);
        if (!classes?.length) return [];

        // 3. Collect unique teacher IDs
        const teacherIds = [
          ...new Set(
            classes.flatMap((c) => (c.teacher_ids as string[] | null) || [])
          ),
        ];
        if (!teacherIds.length) return [];

        // 4. Get teacher names from profiles
        const { data: teachers } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", teacherIds);

        // 5. Map: for each class, list teachers
        return (classes || []).flatMap((cls) =>
          ((cls.teacher_ids as string[] | null) || []).map((tid) => ({
            id: tid,
            name: teachers?.find((t) => t.id === tid)?.name ?? "Unknown",
            className: cls.name ?? "Class",
          }))
        );
      } catch {
        return [];
      }
    },
  });
}
