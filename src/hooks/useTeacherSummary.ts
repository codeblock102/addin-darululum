import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SummaryData } from "@/types/teacher";

export const useTeacherSummary = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-summary', teacherId],
    queryFn: async (): Promise<SummaryData> => {
      if (!teacherId) {
        return {
          totalStudents: 0,
          activeClasses: 0,
          upcomingRevisions: 0,
          completionRate: 0,
          studentsCount: 0,
          recentProgressEntries: 0,
          todayClasses: 0,
          averageQuality: 'N/A',
          totalRevisions: 0,
          pendingRevisions: 0
        };
      }
      
      try {
        // Get assigned students count
        const { data: students, error: studentError } = await supabase
          .from('students_teachers')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('active', true);
          
        if (studentError) throw studentError;
        
        // Get classes scheduled for today
        const today = new Date().toISOString().split('T')[0];
        const { data: classes, error: classError } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', teacherId)
          .contains('days_of_week', [getDayOfWeek()]);
          
        if (classError) throw classError;
        
        // Get recent progress entries (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: progressEntries, error: progressError } = await supabase
          .from('progress')
          .select('id, memorization_quality')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false });
          
        if (progressError) throw progressError;
        
        // Get revisions data
        const { data: revisions, error: revisionsError } = await supabase
          .from('juz_revisions')
          .select('id, memorization_quality')
          .gte('revision_date', sevenDaysAgo.toISOString())
          .order('revision_date', { ascending: false });
          
        if (revisionsError) throw revisionsError;
        
        // Calculate average quality from recent revisions
        const qualityValues = revisions
          ?.filter(revision => revision.memorization_quality)
          .map(revision => revision.memorization_quality);
          
        let averageQuality = 'N/A';
        
        if (qualityValues && qualityValues.length > 0) {
          const qualityMap = {
            'excellent': 5,
            'good': 4,
            'average': 3,
            'needsWork': 2,
            'horrible': 1
          };
          
          const sum = qualityValues.reduce((acc, quality) => {
            return acc + (qualityMap[quality as keyof typeof qualityMap] || 3);
          }, 0);
          
          const avg = sum / qualityValues.length;
          
          if (avg >= 4.5) averageQuality = 'Excellent';
          else if (avg >= 3.5) averageQuality = 'Good';
          else if (avg >= 2.5) averageQuality = 'Average';
          else if (avg >= 1.5) averageQuality = 'Needs Work';
          else averageQuality = 'Poor';
        }
        
        return {
          totalStudents: students?.length || 0,
          activeClasses: classes?.length || 0,
          upcomingRevisions: 0,
          completionRate: progressEntries?.length ? Math.round((progressEntries.length / (students?.length || 1)) * 100) : 0,
          studentsCount: students?.length || 0,
          recentProgressEntries: progressEntries?.length || 0,
          todayClasses: classes?.length || 0,
          averageQuality,
          totalRevisions: revisions?.length || 0,
          pendingRevisions: 0
        };
      } catch (error) {
        console.error("Error fetching teacher summary:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: !!teacherId && teacherId !== 'admin-view'
  });
};

// Helper function to get day of week
const getDayOfWeek = (): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};
