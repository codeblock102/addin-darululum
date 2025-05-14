import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DhorBookEntry, StudentDhorSummary } from "@/types/dhor-book";
import { getStartOfWeekISO } from "@/utils/dateUtils";
import { DhorBookGrid } from "./DhorBookGrid";
import { DhorBookHeader } from "./DhorBookHeader";
import { DhorBookSummary } from "./DhorBookSummary";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";
import { getTotalAyatsInJuz, getUniqueAyatsCoveredInJuz } from "@/utils/juzMetadata";
import { useUpdateStudentCompletedJuz } from "./useUpdateStudentCompletedJuz";

interface DhorBookProps {
  studentId: string;
  teacherId: string;
}

export function DhorBook({ studentId, teacherId }: DhorBookProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get the ISO string for the start of the current week
  const currentWeekISO = getStartOfWeekISO(currentWeek);

  // Set up query keys as constants for consistency
  const entriesQueryKey = ['dhor-book-entries', studentId, currentWeekISO];
  const summaryQueryKey = ['dhor-book-summary', studentId];

  const { data: entries, isLoading: entriesLoading, refetch: refetchEntries } = useQuery<DhorBookEntry[]>({
    queryKey: entriesQueryKey,
    queryFn: async () => {
      const startOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() - currentWeek.getDay()));
      const endOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() - currentWeek.getDay() + 6));
      
      const startOfWeekISO = startOfWeek.toISOString().split('T')[0];
      const endOfWeekISO = endOfWeek.toISOString().split('T')[0];

      console.log(`Fetching dhor entries from ${startOfWeekISO} to ${endOfWeekISO}`);
      
      const { data: dhorEntries, error: dhorError } = await supabase
        .from('dhor_book_entries')
        .select('*') // Step 1: Fetch dhor_book_entries
        .eq('student_id', studentId)
        .gte('entry_date', startOfWeekISO)
        .lte('entry_date', endOfWeekISO)
        .order('entry_date', { ascending: true });

      if (dhorError) {
        console.error("Error fetching dhor book entries:", dhorError);
        throw dhorError;
      }
      
      if (!dhorEntries || dhorEntries.length === 0) {
        console.log("No dhor entries found for this period.");
        return [];
      }

      console.log("Fetched dhor entries:", dhorEntries);

      // Step 2: Extract entry dates
      const entryDates = dhorEntries.map(entry => entry.entry_date).filter(date => date);
      if (entryDates.length === 0) {
        return dhorEntries as DhorBookEntry[]; // Return dhor entries as is if no dates to fetch progress for
      }

      // Step 3: Fetch progress records for these dates
      console.log(`Fetching progress records for student ${studentId} and dates:`, entryDates);
      const { data: progressRecords, error: progressError } = await supabase
        .from('progress')
        .select('date, current_juz, current_surah, start_ayat, end_ayat') // Added current_juz
        .eq('student_id', studentId)
        .in('date', entryDates);

      if (progressError) {
        console.error("Error fetching progress records:", progressError);
        // Proceed without progress data if it fails, but log the error
      }

      console.log("Fetched progress records:", progressRecords);

      // Step 4: Merge progress data into dhor entries
      const progressMap = new Map();
      if (progressRecords) {
        progressRecords.forEach(p => progressMap.set(p.date, p));
      }

      const mergedEntries = dhorEntries.map(entry => {
        const progressData = progressMap.get(entry.entry_date);
        return {
          ...entry,
          progress: progressData ? {
            current_juz: progressData.current_juz,
            current_surah: progressData.current_surah,
            start_ayat: progressData.start_ayat,
            end_ayat: progressData.end_ayat
          } : null
        };
      });

      console.log("Merged entries with progress:", mergedEntries);
      return mergedEntries as DhorBookEntry[];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: summary, refetch: refetchSummary } = useQuery<StudentDhorSummary | null>({
    queryKey: summaryQueryKey,
    queryFn: async () => {
      console.log(`Fetching summary for student ${studentId}`);
      
      const { data, error } = await supabase
        .from('student_dhor_summaries')
        .select('*')
        .eq('student_id', studentId)
        .limit(1);

      if (error) {
        console.error("Error fetching student dhor summary:", error);
        if (error.code !== 'PGRST116' && !error.message.includes("JSON object requested, multiple (or no) rows returned")) {
             throw error;
        }
        return null;
      }
      
      const summaryData = Array.isArray(data) ? data[0] : data;

      if (summaryData) {
        console.log("Fetched summary:", summaryData);
        return summaryData as StudentDhorSummary;
      } else {
        console.log("No summary found for student, returning null.");
        return null;
      }
    },
    refetchOnWindowFocus: false,
  });

  // Query to fetch Juz progress for the selected student
  const { data: juzProgressData, isLoading: isLoadingJuzProgress } = useQuery({
    queryKey: ['student-juz-progress', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data: latestProgress, error: latestError } = await supabase
        .from('progress')
        .select('current_juz')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error("Error fetching latest progress:", latestError);
        return { currentJuz: null, percentage: 0 };
      }
      
      const currentJuz = latestProgress?.current_juz;
      if (!currentJuz) {
        return { currentJuz: null, percentage: 0 };
      }

      const { data: allJuzProgress, error: allProgressError } = await supabase
        .from('progress')
        .select('current_juz, current_surah, start_ayat, end_ayat')
        .eq('student_id', studentId)
        .eq('current_juz', currentJuz);

      if (allProgressError) {
        console.error("Error fetching all progress for Juz:", allProgressError);
        return { currentJuz: currentJuz, percentage: 0 };
      }

      const totalAyatsInJuz = getTotalAyatsInJuz(currentJuz);
      if (totalAyatsInJuz === 0) {
        return { currentJuz: currentJuz, percentage: 0 };
      }

      const uniqueAyatsCovered = getUniqueAyatsCoveredInJuz(allJuzProgress || [], currentJuz);
      const percentage = Math.round((uniqueAyatsCovered.size / totalAyatsInJuz) * 100);
      
      return {
        currentJuz: currentJuz,
        percentage: percentage
      };
    },
    enabled: !!studentId,
  });

  // Get the mutation function for updating completed Juz
  const { mutate: updateCompletedJuz } = useUpdateStudentCompletedJuz();

  // Effect to trigger completed Juz update when progress reaches 100%
  useEffect(() => {
    if (
      juzProgressData && 
      juzProgressData.percentage === 100 && 
      juzProgressData.currentJuz
    ) {
      console.log(`Triggering update for completed Juz: ${juzProgressData.currentJuz}`);
      updateCompletedJuz({ 
        studentId: studentId, 
        newlyCompletedJuz: juzProgressData.currentJuz 
      });
    }
  }, [juzProgressData, studentId, updateCompletedJuz]);

  // Function to refresh both entries and summary
  const refreshData = useCallback(() => {
    console.log("Refreshing dhor book data manually...");
    
    // First invalidate the queries in the cache
    queryClient.invalidateQueries({ queryKey: entriesQueryKey });
    queryClient.invalidateQueries({ queryKey: summaryQueryKey });
    
    // Then explicitly trigger refetches
    Promise.all([
      refetchEntries(),
      refetchSummary()
    ])
    .then(([entriesResult, summaryResult]) => {
      console.log("Refresh complete. New entries:", entriesResult.data);
      toast({
        title: "Data refreshed",
        description: "The dhor book data has been updated."
      });
    })
    .catch(error => {
      console.error("Error refreshing data:", error);
    });
  }, [queryClient, refetchEntries, refetchSummary, entriesQueryKey, summaryQueryKey, toast]);

  if (entriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <DhorBookHeader 
        studentId={studentId} 
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
      />
      
      {/* Display Juz Progress Bar */}
      {studentId && (
        <div className="my-4 p-4 border rounded-md">
          <h3 className="mb-2 text-sm font-medium">Current Juz Progress</h3>
          {isLoadingJuzProgress ? (
            <div className="flex items-center text-sm text-muted-foreground"> <Activity className="h-4 w-4 mr-1 animate-spin"/> Loading...</div>
          ) : juzProgressData?.currentJuz ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Juz {juzProgressData.currentJuz}</span>
                <span>{juzProgressData.percentage}%</span>
              </div>
              <Progress value={juzProgressData.percentage} className="h-2" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No Juz progress data found.</p>
          )}
        </div>
      )}

      <DhorBookGrid 
        entries={entries || []}
        studentId={studentId}
        teacherId={teacherId}
        currentWeek={currentWeek}
        onRefresh={refreshData}
      />
      
      {summary && (
        <DhorBookSummary 
          summary={summary}
          studentId={studentId}
        />
      )}
    </Card>
  );
}
