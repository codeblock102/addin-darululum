
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
              .limit(1);
            
            if (progressError) {
              console.error('Error fetching student progress:', progressError);
              return { 
                id: student.id,
                name: student.name,
                status: student.status
              };
            }
            
            const progress = progressData && progressData.length > 0 ? progressData[0] : {
              current_surah: undefined,
              current_juz: undefined,
              memorization_quality: undefined
            };
            
            // Create type-safe student object with progress data
            return {
              id: student.id,
              name: student.name,
              status: student.status,
              current_surah: progress.current_surah,
              current_juz: progress.current_juz,
              memorization_quality: progress.memorization_quality,
              tajweed_level: progress.tajweed_level
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
