import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StudentDhorSummary } from "@/types/dhor-book";
import type { Database } from "@/types/supabase";
import { getStartOfWeekISO, getWeekDates } from "@/utils/dateUtils";
import { DhorBookGrid } from "./DhorBookGrid";
import { DhorBookHeader } from "./DhorBookHeader";
import { DhorBookSummary } from "./DhorBookSummary";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress as UiProgress } from "@/components/ui/progress";
import { Activity } from "lucide-react";
import { getTotalAyatsInJuz, getUniqueAyatsCoveredInJuz } from "@/utils/juzMetadata";
import { useUpdateStudentCompletedJuz } from "./useUpdateStudentCompletedJuz";

// Define a helper type for table rows from our new Database type
type DbTables = Database["public"]["Tables"];

// Define a new structure for what an entry in the grid might look like
export type DailyActivityEntry = DbTables["progress"]["Row"] & {
  sabaq_para_data?: DbTables["sabaq_para"]["Row"] | null;
  juz_revisions_data?: DbTables["juz_revisions"]["Row"][] | null; 
  comments?: string | null;
  points?: number | null;
  detention?: boolean | null;
  entry_date: string; 
};

interface DhorBookProps {
  studentId: string;
  teacherId: string;
}

export function DhorBook({ studentId, teacherId }: DhorBookProps) {
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentWeekISO = getStartOfWeekISO(currentWeek);

  // Updated query key
  const dailyActivityQueryKey = ['student-daily-activity', studentId, currentWeekISO];
  const summaryQueryKey = ['dhor-book-summary', studentId]; // Assuming this remains based on 'student_dhor_summaries'

  const { data: dailyActivities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery<DailyActivityEntry[]>({
    queryKey: dailyActivityQueryKey,
    queryFn: async () => {
      const startOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() - currentWeek.getDay()));
      const endOfWeek = new Date(new Date(currentWeek).setDate(currentWeek.getDate() - currentWeek.getDay() + 6));
      
      const startOfWeekISO = startOfWeek.toISOString().split('T')[0];
      const endOfWeekISO = endOfWeek.toISOString().split('T')[0];

      console.log(`Fetching student activity from ${startOfWeekISO} to ${endOfWeekISO} for student ${studentId}`);
      
      // Step 1: Fetch progress entries (main sabaq)
      const { data: progressEntries, error: progressError } = await supabase
        .from('progress')
        .select('*') // Fetch all columns for now, can be optimized
        .eq('student_id', studentId)
        .gte('date', startOfWeekISO)
        .lte('date', endOfWeekISO)
        .order('date', { ascending: true });

      if (progressError) {
        console.error("Error fetching progress entries:", progressError);
        throw progressError;
      }
      console.log("Fetched progress entries:", progressEntries);

      // Step 2: Fetch sabaq_para entries
      const { data: sabaqParaEntries, error: sabaqParaError } = await supabase
        .from('sabaq_para')
        .select('*')
        .eq('student_id', studentId)
        .gte('revision_date', startOfWeekISO)
        .lte('revision_date', endOfWeekISO)
        .order('revision_date', { ascending: true });
        
      if (sabaqParaError) {
        console.error("Error fetching sabaq_para entries:", sabaqParaError);
        // Decide if this should be a critical error or if we can proceed
      }
      console.log("Fetched sabaq_para entries:", sabaqParaEntries);

      // Step 3: Fetch juz_revisions entries
      const { data: juzRevisionEntries, error: juzRevisionError } = await supabase
        .from('juz_revisions')
        .select('*')
        .eq('student_id', studentId)
        .gte('revision_date', startOfWeekISO)
        .lte('revision_date', endOfWeekISO)
        .order('revision_date', { ascending: true });

      if (juzRevisionError) {
        console.error("Error fetching juz_revision entries:", juzRevisionError);
        // Decide if this should be a critical error
      }
      console.log("Fetched juz_revision entries:", juzRevisionEntries);

      // Step 4: Merge data. This is a simplified merge. 
      // A more robust merge would create a list of all unique dates and then populate data for each date.
      const activityMap = new Map<string, DailyActivityEntry>();

      // Helper function to create a base/empty progress part
      const createBaseProgressData = (dateStr: string, student_id: string, created_at_val?: string): DbTables["progress"]["Row"] => ({
        id: crypto.randomUUID(), // Generate a unique ID for entries that don't have a base progress record
        student_id: student_id,
        date: dateStr,
        current_juz: null,
        current_surah: null,
        start_ayat: null,
        end_ayat: null,
        pages_memorized: null,
        verses_memorized: null,
        memorization_quality: null,
        teacher_notes: null,
        completed_juz: [],
        last_completed_surah: null,
        last_revision_date: null,
        notes: null,
        revision_status: null,
        created_at: created_at_val || new Date().toISOString(), 
        // Ensure all non-optional fields from the progress table are included here with default/null values
      });

      progressEntries?.forEach(p => {
        if (p.date) {
          activityMap.set(p.date, { 
            ...p, 
            entry_date: p.date, // Standardize on entry_date
            sabaq_para_data: null,
            juz_revisions_data: [] 
          });
        }
      });

      sabaqParaEntries?.forEach(sp => {
        if (sp.revision_date) {
          const existing = activityMap.get(sp.revision_date);
          if (existing) {
            existing.sabaq_para_data = sp;
          } else {
            const baseProgress = createBaseProgressData(sp.revision_date, studentId, sp.created_at);
            activityMap.set(sp.revision_date, {
              ...baseProgress,
              entry_date: sp.revision_date,
              sabaq_para_data: sp,
              juz_revisions_data: [],
            });
          }
        }
      });

      juzRevisionEntries?.forEach(jr => {
        if (jr.revision_date) {
          const existing = activityMap.get(jr.revision_date);
          if (existing) {
            if (!existing.juz_revisions_data) existing.juz_revisions_data = [];
            existing.juz_revisions_data.push(jr);
          } else {
            const baseProgress = createBaseProgressData(jr.revision_date, studentId, jr.created_at);
            activityMap.set(jr.revision_date, {
              ...baseProgress,
              entry_date: jr.revision_date,
              sabaq_para_data: null,
              juz_revisions_data: [jr],
            });
          }
        }
      });
      
      const mergedActivities = Array.from(activityMap.values()).sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

      console.log("Merged daily activities:", mergedActivities);
      return mergedActivities;
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

  const { mutate: updateCompletedJuz } = useUpdateStudentCompletedJuz();

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

  const refreshData = useCallback(() => {
    console.log("Refreshing data manually...");
    queryClient.invalidateQueries({ queryKey: dailyActivityQueryKey });
    queryClient.invalidateQueries({ queryKey: summaryQueryKey });
    queryClient.invalidateQueries({ queryKey: ['student-juz-progress', studentId] });
    
    Promise.all([
      refetchActivities(),
      refetchSummary(),
    ])
    .then(() => {
      toast({ title: "Data refreshed", description: "The Dhor book data has been updated." });
    })
    .catch(error => {
      console.error("Error refreshing data:", error);
      toast({ title: "Refresh Error", description: error.message, variant: "destructive" });
    });
  }, [queryClient, refetchActivities, refetchSummary, dailyActivityQueryKey, summaryQueryKey, studentId, toast]);

  if (activitiesLoading && studentId) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-2 sm:p-4 md:p-6 overflow-hidden">
      <DhorBookHeader 
        studentId={studentId} 
        currentWeek={currentWeek}
        onWeekChange={(newWeekStart) => {
          setCurrentWeek(newWeekStart);
        }}
      />
      <CardContent className="mt-2 sm:mt-4 p-0 sm:p-0">
        {studentId ? (
          <>
            {/* Individual Student's Juz Progress */}
            <div className="my-2 sm:my-4 p-3 sm:p-4 border rounded-md">
              <h3 className="mb-2 text-xs sm:text-sm font-medium">Current Juz Progress</h3>
              {isLoadingJuzProgress ? (
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground"> <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin"/> Loading...</div>
              ) : juzProgressData?.currentJuz ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Juz {juzProgressData.currentJuz}</span>
                    <span>{juzProgressData.percentage}%</span>
                  </div>
                  <UiProgress value={juzProgressData.percentage} className="h-1.5 sm:h-2" />
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No Juz progress data found.</p>
              )}
            </div>

            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-[600px] px-2 sm:px-0 sm:min-w-full">
                <DhorBookGrid 
                  entries={dailyActivities || []}
                  studentId={studentId}
                  teacherId={teacherId}
                  currentWeek={currentWeek}
                  onRefresh={refreshData}
                />
              </div>
            </div>
            
            {summary && (
              <div className="mt-3 sm:mt-6">
                <DhorBookSummary 
                  summary={summary}
                  studentId={studentId}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground p-4 text-center">Select a student to view their weekly log.</p>
        )}
      </CardContent>
    </Card>
  );
}
