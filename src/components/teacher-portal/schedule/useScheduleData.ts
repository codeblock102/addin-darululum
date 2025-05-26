import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client"; // Supabase no longer needed directly here for queries
import { ScheduleFilterState, RevisionScheduleWithStudentName } from "./types";

export const useScheduleData = (teacherId: string, selectedStudentId: string | null, selectedTab: string) => {
  const [filters, setFilters] = useState<ScheduleFilterState>({
    priority: null,
    searchQuery: "",
  });
  const { toast } = useToast();

  const { data: schedules, isLoading, refetch } = useQuery<RevisionScheduleWithStudentName[]>({
    queryKey: ['teacher-schedules', teacherId, selectedStudentId, selectedTab, filters.priority],
    queryFn: async () => {
      // revision_schedule table is being removed, so this feature is effectively disabled.
      // Returning an empty array.
      console.warn("useScheduleData: revision_schedule table functionality has been removed. Returning empty schedule.");
      return [] as RevisionScheduleWithStudentName[]; 
    },
    enabled: !!teacherId,
  });

  const updateStatus = async (scheduleId: string, status: string) => {
    // No-op as revision_schedule is removed
    toast({
      title: "Feature Disabled",
      description: "Revision schedule management has been disabled.",
    });
    console.warn(`useScheduleData: updateStatus called for scheduleId ${scheduleId} to status ${status}, but revision_schedule is removed.`);
    return false; 
  };

  const markCompleted = (scheduleId: string) => updateStatus(scheduleId, 'completed');
  const cancelRevision = (scheduleId: string) => updateStatus(scheduleId, 'cancelled');

  // Filter schedules based on search query - will operate on an empty array
  const filteredSchedules = schedules?.filter(schedule => {
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
    schedules: filteredSchedules || [], // Ensure it's always an array
    isLoading,
    filters,
    setFilters,
    markCompleted,
    cancelRevision
  };
};
