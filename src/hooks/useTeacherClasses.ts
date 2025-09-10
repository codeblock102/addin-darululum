import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

const fetchTeacherClasses = async (teacherId: string) => {
  // Fetch classes where either class-level teacher_ids contains teacherId
  // OR there are any time_slots (we'll filter client-side by per-slot teacher_ids)
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, subject, days_of_week, teacher_ids, time_slots")
    .or(`teacher_ids.cs.{"${teacherId}"},time_slots.not.is.null`);

  if (error) {
    console.error("Error fetching teacher classes:", error);
    throw error;
  }

  const classes = (data || []) as Array<{
    id: string;
    name: string;
    subject?: string | null;
    days_of_week?: string[] | null;
    teacher_ids?: string[] | null;
    time_slots?: Array<{ teacher_ids?: string[] | null }> | null;
  }>;

  // Keep classes where the teacher is assigned at class-level OR in any slot
  const filtered = classes.filter((c) => {
    const classLevel = Array.isArray(c.teacher_ids) && c.teacher_ids.includes(teacherId);
    const slotLevel = Array.isArray(c.time_slots)
      && c.time_slots.some((s) => Array.isArray(s?.teacher_ids) && (s!.teacher_ids as string[]).includes(teacherId));
    return classLevel || slotLevel;
  });

  return filtered;
};

export const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ["teacherClasses", teacherId],
    queryFn: () => fetchTeacherClasses(teacherId),
    enabled: !!teacherId,
  });
}; 