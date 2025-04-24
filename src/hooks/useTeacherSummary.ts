
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryData } from "@/types/teacher";

export const useTeacherSummary = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-summary', teacherId],
    queryFn: async (): Promise<SummaryData> => {
      // Get assigned students count
      const studentsQuery = await supabase
        .from('students_teachers')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('active', true);
      
      // Get recent progress entries (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();
      
      const progressQuery = await supabase
        .from('progress')
        .select('id, memorization_quality')
        .gte('created_at', sevenDaysAgoStr);
      
      // Get today's classes
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const classesQuery = await supabase
        .from('schedules')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('day_of_week', today);

      // Get revision statistics
      const revisionsQuery = await supabase
        .from('juz_revisions')
        .select('id, memorization_quality')
        .eq('teacher_notes', 'pending')
        .is('teacher_notes', null);

      // Calculate average quality from progress entries
      const qualities = progressQuery.data?.map(p => p.memorization_quality) || [];
      const averageQuality = qualities.length > 0 
        ? qualities.reduce((acc, curr) => {
            if (curr === 'excellent') return acc + 5;
            if (curr === 'good') return acc + 4;
            if (curr === 'average') return acc + 3;
            if (curr === 'needsWork') return acc + 2;
            return acc + 1;
          }, 0) / qualities.length
        : 0;

      const qualityLabel = averageQuality >= 4.5 ? 'excellent' 
        : averageQuality >= 3.5 ? 'good'
        : averageQuality >= 2.5 ? 'average'
        : averageQuality >= 1.5 ? 'needs work'
        : 'poor';
      
      // Return summary data
      return {
        studentsCount: studentsQuery.data?.length || 0,
        recentProgressEntries: progressQuery.data?.length || 0,
        todayClasses: classesQuery.data?.length || 0,
        averageQuality: qualityLabel,
        totalRevisions: revisionsQuery.data?.length || 0,
        pendingRevisions: revisionsQuery.data?.filter(r => r.teacher_notes === 'pending').length || 0
      };
    }
  });
};
