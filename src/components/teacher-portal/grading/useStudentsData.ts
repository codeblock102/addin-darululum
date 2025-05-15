
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/types/teacher";

export const useStudentsData = () => {
  return useQuery({
    queryKey: ['all-students-for-grading'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      const studentsWithProgress = await Promise.all(
        data.map(async (student) => {
          try {
            const { data: progressData, error: progressError } = await supabase
              .from('progress')
              .select('current_surah, current_juz, memorization_quality')
              .eq('student_id', student.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            // If there's no progress data, return basic student info
            if (progressError || !progressData) {
              return { 
                id: student.id,
                name: student.name,
                status: student.status
              } as Student;
            }
            
            // Create type-safe student object with progress data
            return {
              id: student.id,
              name: student.name,
              status: student.status,
              current_surah: progressData.current_surah,
              current_juz: progressData.current_juz,
              memorization_quality: progressData.memorization_quality
            } as Student;
          } catch (err) {
            console.error('Error processing student data:', err);
            return { 
              id: student.id,
              name: student.name,
              status: student.status
            } as Student;
          }
        })
      );
      
      return studentsWithProgress;
    }
  });
};
