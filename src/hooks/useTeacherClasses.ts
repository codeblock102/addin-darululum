import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

const fetchTeacherClasses = async (teacherId: string) => {
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, subject")
    .contains("teacher_ids", `{${teacherId}}`);

  if (error) {
    console.error("Error fetching teacher classes:", error);
    throw error;
  }

  return data || [];
};

export const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ["teacherClasses", teacherId],
    queryFn: () => fetchTeacherClasses(teacherId),
    enabled: !!teacherId,
  });
}; 