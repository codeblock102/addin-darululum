
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsData {
  teacherId: string;
  qualityDistribution: {
    name: string;
    value: number;
    color?: string;
  }[];
  timeProgress: {
    date: string;
    count: number;
  }[];
  studentProgress: {
    name: string;
    progress: number;
    lastQuality?: string;
  }[];
  contributorActivity: {
    name: string;
    count: number;
    color?: string;
  }[];
}

export const useAnalyticsData = (teacherId: string) => {
  return useQuery({
    queryKey: ['analytics-data', teacherId],
    queryFn: async (): Promise<AnalyticsData> => {
      // Create an empty result object
      const result: AnalyticsData = {
        teacherId,
        qualityDistribution: [],
        timeProgress: [],
        studentProgress: [],
        contributorActivity: [],
      };

      // Quality Distribution (memorization quality breakdown)
      const { data: qualityData, error: qualityError } = await supabase
        .from('progress')
        .select('memorization_quality, count')
        .not('memorization_quality', 'is', null)
        .order('memorization_quality')
        .group('memorization_quality')
        .filter('date', 'gte', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (qualityError) console.error('Error fetching quality distribution:', qualityError);
      
      if (qualityData) {
        // Map quality ratings to user-friendly names and colors
        const qualityMap: Record<string, { label: string, color: string }> = {
          excellent: { label: 'Excellent', color: '#10b981' },  // green
          good: { label: 'Good', color: '#3b82f6' },            // blue
          average: { label: 'Average', color: '#f59e0b' },      // yellow
          needsWork: { label: 'Needs Work', color: '#f97316' },  // orange
          horrible: { label: 'Incomplete', color: '#ef4444' },   // red
        };

        result.qualityDistribution = qualityData.map(item => ({
          name: qualityMap[item.memorization_quality]?.label || item.memorization_quality,
          value: parseInt(item.count),
          color: qualityMap[item.memorization_quality]?.color
        }));
      }

      // Time Progress (progress entries over time)
      const { data: timeData, error: timeError } = await supabase
        .from('progress')
        .select('date, count')
        .not('date', 'is', null)
        .order('date')
        .group('date')
        .filter('date', 'gte', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (timeError) console.error('Error fetching time progress:', timeError);
      
      if (timeData) {
        result.timeProgress = timeData.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: parseInt(item.count)
        }));
      }

      // Student Progress (per student)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, 
          name,
          progress:progress(
            current_surah, 
            memorization_quality,
            created_at
          )
        `)
        .eq('status', 'active')
        .order('name');

      if (studentsError) console.error('Error fetching student progress:', studentsError);

      if (studentsData) {
        result.studentProgress = studentsData.map(student => {
          // Sort progress entries by date (newest first)
          const sortedProgress = student.progress
            ? Array.isArray(student.progress)
              ? [...student.progress].sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
              : []
            : [];
          
          // Get last quality rating
          const lastQuality = sortedProgress.length > 0 ? sortedProgress[0].memorization_quality : undefined;
          
          // Get max surah number as progress indicator
          const maxSurah = sortedProgress.reduce((max, entry) => 
            entry.current_surah ? Math.max(max, entry.current_surah) : max, 0);
          
          // Calculate progress as percentage (total Quran has 114 surahs)
          const progressPercentage = Math.round((maxSurah / 114) * 100);
          
          return {
            name: student.name,
            progress: progressPercentage,
            lastQuality
          };
        });
      }

      // Contributor Activity (entries by contributor)
      const { data: contributorData, error: contributorError } = await supabase
        .from('progress')
        .select('contributor_name, count')
        .not('contributor_name', 'is', null)
        .group('contributor_name')
        .order('count', { ascending: false });

      if (contributorError) console.error('Error fetching contributor activity:', contributorError);
      
      if (contributorData) {
        // Generate some colors for contributors
        const contributorColors = [
          '#a855f7', // purple
          '#ec4899', // pink
          '#14b8a6', // teal
          '#6366f1', // indigo
          '#f59e0b', // amber
        ];
        
        result.contributorActivity = contributorData.map((item, index) => ({
          name: item.contributor_name,
          count: parseInt(item.count),
          color: contributorColors[index % contributorColors.length]
        }));
      }

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
