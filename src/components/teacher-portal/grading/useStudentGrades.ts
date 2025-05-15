
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentGrade } from "./types";

export const useStudentGrades = (selectedStudent: string, students: any[]) => {
  return useQuery({
    queryKey: ['student-grades', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      
      const student = students?.find(s => s.name === selectedStudent);
      
      if (!student) return [];
      
      const { data, error } = await supabase
        .from('progress')
        .select('current_surah, current_juz, memorization_quality, tajweed_level, created_at, date, contributor_name')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching student grades:', error);
        return [];
      }
      
      return data as StudentGrade[];
    },
    enabled: !!selectedStudent && !!students?.length
  });
};
