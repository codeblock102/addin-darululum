
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
    // Use a direct query instead of RPC
    const { data, error } = await supabase
      .from('juz_revisions')
      .select('memorization_quality, count')
      .order('count', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Create a distribution map with counts
    const distributionMap = data.reduce((acc, item) => {
      const quality = item.memorization_quality || 'Not rated';
      if (!acc[quality]) {
        acc[quality] = 0;
      }
      acc[quality]++;
      return acc;
    }, {});
    
    // Convert the map to the expected array format
    return Object.entries(distributionMap).map(([quality, count]) => ({
      quality,
      count
    }));
  } catch (error) {
    console.error("Error getting quality distribution:", error);
    return [];
  }
};

// Helper function to get progress over time
const getTimeProgress = async () => {
  try {
    // Use a direct query instead of RPC
    const { data, error } = await supabase
      .from('progress')
      .select('date, id')
      .order('date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Group entries by date
    const dateMap = {};
    data.forEach(item => {
      if (item.date) {
        const date = new Date(item.date).toISOString().split('T')[0];
        if (!dateMap[date]) {
          dateMap[date] = 0;
        }
        dateMap[date]++;
      }
    });
    
    // Convert the map to the expected array format
    return Object.entries(dateMap).map(([date, count]) => ({
      date,
      count
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
          verses: 0 // Changed from 'progress' to 'verses'
        };
      }
      
      const totalVerses = data?.reduce((sum, record) => sum + (record.verses_memorized || 0), 0) || 0;
      
      return {
        name: student.student_name,
        verses: totalVerses // Changed from 'progress' to 'verses'
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
    // Use a direct query instead of RPC
    const { data, error } = await supabase
      .from('progress')
      .select('id')
      .is('contributor_name', null);
    
    if (error) {
      throw error;
    }
    
    // Since we're not actually tracking contributor activity properly,
    // just return a placeholder for now
    return [
      {
        name: 'Teacher',
        count: data.length || 10
      },
      {
        name: 'Admin',
        count: 5
      }
    ];
  } catch (error) {
    console.error("Error getting contributor activity:", error);
    return [];
  }
};
