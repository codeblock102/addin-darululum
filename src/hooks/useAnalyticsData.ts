
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QualityDistribution {
  name: string;
  value: number;
}

interface StudentProgress {
  name: string;
  verses: number;
}

interface TimeProgress {
  date: string;
  count: number;
}

export interface AnalyticsData {
  qualityDistribution: QualityDistribution[];
  studentProgress: StudentProgress[];
  timeProgress: TimeProgress[];
}

export const useAnalyticsData = (teacherId: string, timeRange: string) => {
  return useQuery({
    queryKey: ['teacher-analytics', teacherId, timeRange],
    queryFn: async (): Promise<AnalyticsData | null> => {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          memorization_quality,
          verses_memorized,
          created_at,
          students (
            name
          )
        `)
        .gte('created_at', startDate.toISOString());
      
      if (progressError) {
        console.error('Error fetching progress:', progressError);
        return null;
      }
      
      // Process data for charts
      const qualityCount = {
        excellent: 0,
        good: 0,
        average: 0,
        needsWork: 0,
        horrible: 0
      };
      
      const studentVerses: Record<string, number> = {};
      const progressByDate: Record<string, number> = {};
      
      progressData.forEach((entry) => {
        // Quality distribution
        if (entry.memorization_quality) {
          qualityCount[entry.memorization_quality as keyof typeof qualityCount]++;
        }
        
        // Student progress
        const studentName = entry.students?.name || 'Unknown';
        studentVerses[studentName] = (studentVerses[studentName] || 0) + (entry.verses_memorized || 0);
        
        // Progress over time
        const date = new Date(entry.created_at).toLocaleDateString();
        progressByDate[date] = (progressByDate[date] || 0) + 1;
      });
      
      return {
        qualityDistribution: Object.entries(qualityCount).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })),
        studentProgress: Object.entries(studentVerses)
          .map(([name, verses]) => ({ name, verses }))
          .sort((a, b) => b.verses - a.verses)
          .slice(0, 10),
        timeProgress: Object.entries(progressByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
    }
  });
};
