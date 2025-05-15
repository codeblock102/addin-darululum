
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentLeaderboardData, LeaderboardFilters } from '@/types/leaderboard';

export function useLeaderboardData(teacherId?: string, filters: LeaderboardFilters = { 
  timeRange: 'week', 
  metricPriority: 'total' 
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

  // Fetch leaderboard data with filtering
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', teacherId, filters],
    queryFn: async () => {
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

        // Get dhor book entries
        let dhorBookQuery = supabase
          .from('dhor_book_entries')
          .select('student_id, entry_date, points')
          .in('student_id', studentIds);
        
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
          dhorBookQuery = dhorBookQuery.gte('entry_date', dateString);
          sabaqParaQuery = sabaqParaQuery.gte('revision_date', dateString);
          juzRevisionsQuery = juzRevisionsQuery.gte('revision_date', dateString);
        }
        
        // Execute queries
        const [dhorResult, sabaqParaResult, juzRevisionsResult] = await Promise.all([
          dhorBookQuery,
          sabaqParaQuery,
          juzRevisionsQuery
        ]);
        
        if (dhorResult.error) throw dhorResult.error;
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
        
        // Add Dhor book entries
        if (dhorResult.data) {
          dhorResult.data.forEach(entry => {
            const studentId = entry.student_id;
            if (studentId && studentStats[studentId]) {
              studentStats[studentId].dhor += 1;
              studentStats[studentId].totalPoints += entry.points || 0;
              
              // Track last activity
              if (!studentStats[studentId].lastActivity || 
                  entry.entry_date > studentStats[studentId].lastActivity) {
                studentStats[studentId].lastActivity = entry.entry_date;
              }
            }
          });
        }
        
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
        
        // Convert to array for sorting
        const leaderboardArray = Object.values(studentStats);
        
        // Sort based on filter priority
        let sortedArray: StudentLeaderboardData[];
        switch (filters.metricPriority) {
          case 'sabaq':
            sortedArray = leaderboardArray.sort((a, b) => b.sabaqs - a.sabaqs);
            break;
          case 'sabaqPara':
            sortedArray = leaderboardArray.sort((a, b) => b.sabaqPara - a.sabaqPara);
            break;
          case 'dhor':
            sortedArray = leaderboardArray.sort((a, b) => b.dhor - a.dhor);
            break;
          case 'total':
          default:
            sortedArray = leaderboardArray.sort((a, b) => {
              // First by total points
              const pointsDiff = b.totalPoints - a.totalPoints;
              if (pointsDiff !== 0) return pointsDiff;
              
              // Then by total activities
              const totalActivitiesA = a.sabaqs + a.sabaqPara + a.dhor;
              const totalActivitiesB = b.sabaqs + b.sabaqPara + b.dhor;
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
    },
    enabled: !!teacherId,
  });

  return {
    leaderboardData: data || [],
    isLoading,
    error,
    refetch,
    topStudent: data && data.length ? data[0] : null,
  };
}
