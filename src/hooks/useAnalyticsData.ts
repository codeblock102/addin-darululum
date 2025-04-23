
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAnalyticsData = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-analytics', teacherId],
    queryFn: async () => {
      try {
        // Get quality distribution data
        const qualityDistribution = await getQualityDistribution();
        
        // Get progress over time
        const timeProgress = await getTimeProgress();
        
        // Get student progress
        const studentProgress = await getStudentProgress(teacherId);
        
        // Get contributor activity
        const contributorActivity = await getContributorActivity();
        
        return {
          qualityDistribution,
          timeProgress,
          studentProgress,
          contributorActivity
        };
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        throw new Error("Failed to fetch analytics data");
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Helper function to get quality distribution
const getQualityDistribution = async () => {
  try {
    // Create SQL query to get distribution with counts
    const { data, error } = await supabase.rpc('get_quality_distribution');
    
    if (error) {
      throw error;
    }
    
    // Map to expected format
    return data.map((item: any) => ({
      quality: item.memorization_quality === null ? 'Not rated' : item.memorization_quality,
      count: item.count
    }));
  } catch (error) {
    console.error("Error getting quality distribution:", error);
    return [];
  }
};

// Helper function to get progress over time
const getTimeProgress = async () => {
  try {
    // Create SQL query to get progress by date with counts
    const { data, error } = await supabase.rpc('get_progress_by_date');
    
    if (error) {
      throw error;
    }
    
    // Map to expected format and add zeros for dates with no entries
    return data.map((item: any) => ({
      date: item.date,
      count: item.count
    }));
  } catch (error) {
    console.error("Error getting time progress:", error);
    return [];
  }
};

// Helper function to get student progress
const getStudentProgress = async (teacherId: string) => {
  try {
    // First get the students assigned to this teacher
    const { data: students, error: studentsError } = await supabase
      .from('students_teachers')
      .select('id, student_name')
      .eq('teacher_id', teacherId)
      .eq('active', true);
    
    if (studentsError) {
      throw studentsError;
    }
    
    if (!students || students.length === 0) {
      return [];
    }
    
    // Now for each student, get their total verses memorized
    const studentDataPromises = students.map(async (student) => {
      const { data, error } = await supabase
        .from('progress')
        .select('verses_memorized, memorization_quality')
        .eq('student_id', student.id)
        .order('date', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error(`Error fetching progress for student ${student.student_name}:`, error);
        return {
          name: student.student_name,
          progress: 0,
          lastQuality: undefined
        };
      }
      
      const totalVerses = data?.reduce((sum, record) => sum + (record.verses_memorized || 0), 0) || 0;
      const lastQuality = data && data.length > 0 ? data[0].memorization_quality : undefined;
      
      return {
        name: student.student_name,
        progress: totalVerses,
        lastQuality
      };
    });
    
    return Promise.all(studentDataPromises);
  } catch (error) {
    console.error("Error getting student progress:", error);
    return [];
  }
};

// Helper function to get contributor activity
const getContributorActivity = async () => {
  try {
    // Create SQL query to get contributor activity with counts
    const { data, error } = await supabase.rpc('get_contributor_activity');
    
    if (error) {
      throw error;
    }
    
    // Map to expected format
    return data.map((item: any) => ({
      name: item.contributor_name || 'Unknown',
      count: item.count
    }));
  } catch (error) {
    console.error("Error getting contributor activity:", error);
    return [];
  }
};
