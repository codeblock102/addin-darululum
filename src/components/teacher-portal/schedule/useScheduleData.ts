
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScheduleFilterState, RevisionScheduleWithStudentName } from "./types";

export const useScheduleData = (teacherId: string, selectedStudentId: string | null, selectedTab: string) => {
  const [filters, setFilters] = useState<ScheduleFilterState>({
    priority: null,
    searchQuery: "",
  });
  const { toast } = useToast();

  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ['teacher-schedules', teacherId, selectedStudentId, selectedTab, filters.priority],
    queryFn: async () => {
      try {
        let query = supabase
          .from('revision_schedule')
          .select(`
            id, 
            student_id, 
            juz_number,
            surah_number,
            scheduled_date,
            priority,
            status,
            created_at,
            notes,
            students:student_id (name)
          `);

        if (selectedStudentId) {
          query = query.eq('student_id', selectedStudentId);
        } else {
          // Only get schedules for students assigned to this teacher
          const { data: assignedStudents } = await supabase
            .from('students_teachers')
            .select('student_name')
            .eq('teacher_id', teacherId)
            .eq('active', true);

          if (assignedStudents && assignedStudents.length > 0) {
            // Get the student IDs from the names
            const studentNames = assignedStudents.map(s => s.student_name);
            const { data: studentData } = await supabase
              .from('students')
              .select('id')
              .in('name', studentNames);
              
            if (studentData && studentData.length > 0) {
              const studentIds = studentData.map(s => s.id);
              query = query.in('student_id', studentIds);
            }
          }
        }

        // Filter by status
        if (selectedTab === 'upcoming') {
          query = query.in('status', ['pending', 'postponed']);
        } else if (selectedTab === 'completed') {
          query = query.eq('status', 'completed');
        } else if (selectedTab === 'cancelled') {
          query = query.eq('status', 'cancelled');
        }

        // Filter by priority if selected
        if (filters.priority && filters.priority !== 'all') {
          query = query.eq('priority', filters.priority);
        }

        const { data, error } = await query.order('scheduled_date', { ascending: true });

        if (error) {
          console.error('Error fetching schedules:', error);
          return [] as RevisionScheduleWithStudentName[];
        }
        
        // Handle nested join errors and provide default values
        return (data || []).map(item => {
          // Safely check if students property exists and provide default values
          const defaultStudentName = "Unknown Student";
          const defaultStudentObj = { name: defaultStudentName };
          
          // Define the properly typed return object with default values first
          const result: RevisionScheduleWithStudentName = {
            id: item.id,
            student_id: item.student_id,
            juz_number: item.juz_number,
            surah_number: item.surah_number,
            scheduled_date: item.scheduled_date,
            priority: (item.priority || 'medium') as "high" | "medium" | "low",
            status: (item.status || 'pending') as "pending" | "completed" | "cancelled" | "postponed",
            created_at: item.created_at,
            notes: item.notes || '',
            students: defaultStudentObj
          };
          
          // Now safely check and update the students object if valid data exists
          if (item.students !== null && item.students !== undefined) {
            // Check if it's a valid object (not an error) before trying to use it
            if (
              typeof item.students === 'object' && 
              !('error' in item.students) &&
              item.students
            ) {
              // Type assertion after validation
              const studentData = item.students as { name?: string };
              if (studentData && typeof studentData.name === 'string') {
                result.students = { name: studentData.name };
              }
            }
          }

          return result;
        });
      } catch (error) {
        console.error('Error fetching schedules:', error);
        return [] as RevisionScheduleWithStudentName[];
      }
    },
    enabled: !!teacherId,
  });

  const updateStatus = async (scheduleId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('revision_schedule')
        .update({ status })
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: `Revision ${status}`,
        description: `The revision has been ${status}`,
      });
      
      refetch();
      return true;
    } catch (error) {
      console.error(`Error updating revision status to ${status}:`, error);
      toast({
        title: "Error",
        description: `Failed to update revision status`,
        variant: "destructive",
      });
      return false;
    }
  };

  const markCompleted = (scheduleId: string) => updateStatus(scheduleId, 'completed');
  const cancelRevision = (scheduleId: string) => updateStatus(scheduleId, 'cancelled');

  // Filter schedules based on search query
  const filteredSchedules = schedules?.filter(schedule => {
    // Add null check for students and name properties
    const studentName = schedule.students?.name?.toLowerCase() || '';
    const juzNumber = `Juz ${schedule.juz_number}`.toLowerCase();
    const surahNumber = schedule.surah_number ? `Surah ${schedule.surah_number}`.toLowerCase() : '';
    
    return (
      studentName.includes(filters.searchQuery.toLowerCase()) ||
      juzNumber.includes(filters.searchQuery.toLowerCase()) ||
      surahNumber.includes(filters.searchQuery.toLowerCase())
    );
  });

  return {
    schedules: filteredSchedules,
    isLoading,
    filters,
    setFilters,
    markCompleted,
    cancelRevision
  };
};
