import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client.ts';
import { StudentLeaderboardData, LeaderboardFilters } from '@/types/leaderboard.ts';

export function useLeaderboardData(teacherId?: string, filters: LeaderboardFilters = { 
  timeRange: 'week', 
  metricPriority: 'total',
  participationFilter: 'all',
  completionStatus: 'all'
}) {
  const [timeRangeDate, setTimeRangeDate] = useState<Date | null>(null);

  // Set the date filter based on timeRange
  useEffect(() => {
    const now = new Date();
    
    switch(filters.timeRange) {
      case 'today':
        setTimeRangeDate(now);
        break;
      case 'week':
        const lastWeek = new Date();
        lastWeek.setDate(now.getDate() - 7);
        setTimeRangeDate(lastWeek);
        break;
      case 'month':
        const lastMonth = new Date();
        lastMonth.setMonth(now.getMonth() - 1);
        setTimeRangeDate(lastMonth);
        break;
      case 'all':
      default:
        setTimeRangeDate(null);
        break;
    }
  }, [filters.timeRange]);
  
  // Function to fetch data
  const fetchLeaderboardData = useCallback(async () => {
    if (!teacherId) return [];

    try {
      // First get all students assigned to this teacher
      const { data: students, error: studentsError } = await supabase
        .from('students_teachers')
        .select('student_name, id')
        .eq('teacher_id', teacherId)
        .eq('active', true);

      if (studentsError) throw studentsError;
      if (!students?.length) return [];

      const studentIds = students.map(s => s.id);
      const studentNames = students.reduce((acc, s) => {
        acc[s.id] = s.student_name;
        return acc;
      }, {} as Record<string, string>);

      // Get sabaq para entries  
      let sabaqParaQuery = supabase
        .from('sabaq_para')
        .select('student_id, revision_date')
        .in('student_id', studentIds);
        
      // Get juz revisions entries
      let juzRevisionsQuery = supabase
        .from('juz_revisions')
        .select('student_id, revision_date')
        .in('student_id', studentIds);
        
      // Apply date filter if needed
      if (timeRangeDate) {
        const dateString = timeRangeDate.toISOString().split('T')[0];
        sabaqParaQuery = sabaqParaQuery.gte('revision_date', dateString);
        juzRevisionsQuery = juzRevisionsQuery.gte('revision_date', dateString);
      }
      
      // Execute queries
      const [sabaqParaResult, juzRevisionsResult] = await Promise.all([
        sabaqParaQuery,
        juzRevisionsQuery
      ]);
      
      if (sabaqParaResult.error) throw sabaqParaResult.error;
      if (juzRevisionsResult.error) throw juzRevisionsResult.error;
      
      // Process data to get counts per student
      const studentStats: Record<string, StudentLeaderboardData> = {};
      
      // Initialize data for all students
      studentIds.forEach(id => {
        studentStats[id] = {
          id,
          name: studentNames[id] || 'Unknown Student',
          sabaqs: 0,
          sabaqPara: 0,
          dhor: 0,
          totalPoints: 0,
          lastActivity: '',
        };
      });
      
      // Add Sabaq Para entries
      if (sabaqParaResult.data) {
        sabaqParaResult.data.forEach(entry => {
          const studentId = entry.student_id;
          if (studentId && studentStats[studentId]) {
            studentStats[studentId].sabaqPara += 1;
            
            // Track last activity
            if (!studentStats[studentId].lastActivity || 
                entry.revision_date > studentStats[studentId].lastActivity) {
              studentStats[studentId].lastActivity = entry.revision_date;
            }
          }
        });
      }
      
      // Add Juz Revisions entries (Sabaq)
      if (juzRevisionsResult.data) {
        juzRevisionsResult.data.forEach(entry => {
          const studentId = entry.student_id;
          if (studentId && studentStats[studentId]) {
            studentStats[studentId].sabaqs += 1;
            
            // Track last activity
            if (!studentStats[studentId].lastActivity || 
                entry.revision_date > studentStats[studentId].lastActivity) {
              studentStats[studentId].lastActivity = entry.revision_date;
            }
          }
        });
      }
      
      // Convert to array for filtering and sorting
      let leaderboardArray = Object.values(studentStats);
      
      // Apply additional filters
      if (filters.participationFilter !== 'all') {
        leaderboardArray = leaderboardArray.filter(student => {
          const hasActivity = student.sabaqs > 0 || student.sabaqPara > 0;
          return filters.participationFilter === 'active' ? hasActivity : !hasActivity;
        });
      }
      
      if (filters.completionStatus !== 'all') {
        leaderboardArray = leaderboardArray.filter(student => {
          const hasAllSubjects = student.sabaqs > 0 && student.sabaqPara > 0;
          return filters.completionStatus === 'complete' ? hasAllSubjects : !hasAllSubjects;
        });
      }
      
      // Sort based on filter priority
      let sortedArray: StudentLeaderboardData[];
      switch (filters.metricPriority) {
        case 'sabaq':
          sortedArray = leaderboardArray.sort((a, b) => b.sabaqs - a.sabaqs);
          break;
        case 'sabaqPara':
          sortedArray = leaderboardArray.sort((a, b) => b.sabaqPara - a.sabaqPara);
          break;
        case 'total':
        default:
          sortedArray = leaderboardArray.sort((a, b) => {
            // First by total points (now only from sabaqs, assuming 1 point per sabaq)
            const pointsA = a.sabaqs;
            const pointsB = b.sabaqs;
            const pointsDiff = pointsB - pointsA;
            if (pointsDiff !== 0) return pointsDiff;
            
            // Then by total activities
            const totalActivitiesA = a.sabaqs + a.sabaqPara;
            const totalActivitiesB = b.sabaqs + b.sabaqPara;
            return totalActivitiesB - totalActivitiesA;
          });
      }
      
      // Add rank
      return sortedArray.map((student, index) => ({
        ...student,
        rank: index + 1
      }));
      
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      return [];
    }
  }, [teacherId, timeRangeDate, filters]);

  // Set up query with react-query
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['leaderboard', teacherId, filters, timeRangeDate],
    queryFn: fetchLeaderboardData,
    enabled: !!teacherId,
  });
  
  // Provide a refresh function that wraps refetch
  const refreshData = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    leaderboardData: data || [],
    isLoading,
    error,
    refetch,
    refreshData,
    topStudent: data && data.length ? data[0] : null,
  };
}
