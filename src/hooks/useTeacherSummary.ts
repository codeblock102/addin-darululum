
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryData, SupabaseQueryResult } from "@/types/teacher";

export const useTeacherSummary = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-summary', teacherId],
    queryFn: async (): Promise<SummaryData> => {
      // Fetch assigned students count
      const studentsQuery: SupabaseQueryResult<{ id: string }> = await supabase
        .from('students_teachers')
        .select('id')
        .eq('teacher_id', teacherId);
      
      if (studentsQuery.error) {
        console.error('Error fetching assigned students:', studentsQuery.error);
      }
      
      // Fetch recent progress entries (last 7 days)
      const progressQuery: SupabaseQueryResult<{ id: string }> = await supabase
        .from('progress')
        .select('id')
        .eq('teacher_id', teacherId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (progressQuery.error) {
        console.error('Error fetching recent progress:', progressQuery.error);
      }
      
      // Fetch today's classes
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const classesQuery: SupabaseQueryResult<{ id: string }> = await supabase
        .from('schedules')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('day_of_week', today);
      
      if (classesQuery.error) {
        console.error('Error fetching today classes:', classesQuery.error);
      }
      
      // Return summary data
      return {
        studentsCount: studentsQuery.data?.length || 0,
        recentProgressEntries: progressQuery.data?.length || 0,
        todayClasses: classesQuery.data?.length || 0
      };
    }
  });
};
