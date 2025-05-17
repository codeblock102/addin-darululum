
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { addWeeks, subWeeks, format, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DhorBookGrid } from "./DhorBookGrid";
import { DailyActivityEntry } from "@/types/dhor-book";
import { useToast } from "@/hooks/use-toast";

interface DhorBookProps {
  studentId: string;
  teacherId?: string;
}

export const DhorBook = ({ studentId, teacherId }: DhorBookProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [entries, setEntries] = useState<DailyActivityEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Format dates for display
  const weekStart = startOfWeek(currentWeek);
  const weekEnd = endOfWeek(currentWeek);
  const formattedDateRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  // Previous and next week handlers
  const goToPreviousWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const goToCurrentWeek = () => setCurrentWeek(new Date());

  // Fetch main entries for the student
  const { 
    data: entriesData, 
    isLoading, 
    refetch,
  } = useQuery({
    queryKey: ["dhor-book-entries", studentId, format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      console.log(`Fetching dhor book for student ${studentId} between ${format(weekStart, 'yyyy-MM-dd')} and ${format(weekEnd, 'yyyy-MM-dd')}`);
      
      // Get entries from dhor_book_entries table for this week
      const { data: dhorEntries, error } = await supabase
        .from('dhor_book_entries')
        .select('*')
        .eq('student_id', studentId)
        .gte('entry_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('entry_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('entry_date', { ascending: false });

      if (error) {
        console.error("Error fetching dhor book entries:", error);
        throw error;
      }
      
      // Get juz_revisions for this student and week to attach to entries
      const { data: juzRevisions, error: juzError } = await supabase
        .from('juz_revisions')
        .select('*')
        .eq('student_id', studentId)
        .gte('revision_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('revision_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('revision_date', { ascending: false });
      
      if (juzError) {
        console.error("Error fetching juz revisions:", juzError);
      }
      
      // Get sabaq_para entries for this student and week
      const { data: sabaqPara, error: sabaqError } = await supabase
        .from('sabaq_para')
        .select('*')
        .eq('student_id', studentId)
        .gte('revision_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('revision_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('revision_date', { ascending: false });
      
      if (sabaqError) {
        console.error("Error fetching sabaq para:", sabaqError);
      }
      
      // Get progress entries for this student and week
      const { data: progressEntries, error: progressError } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', studentId)
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('date', { ascending: false });
      
      if (progressError) {
        console.error("Error fetching progress:", progressError);
      }

      console.log("Juz revisions:", juzRevisions);
      console.log("Sabaq para:", sabaqPara);
      console.log("Progress entries:", progressEntries);

      // Combine data from different tables into comprehensive entries
      let combinedEntries: DailyActivityEntry[] = [];
      
      // First, organize juz revisions by date and dhor_slot
      const juzRevisionsByDate: Record<string, any[]> = {};
      if (juzRevisions) {
        juzRevisions.forEach(revision => {
          const dateKey = revision.revision_date;
          if (!juzRevisionsByDate[dateKey]) {
            juzRevisionsByDate[dateKey] = [];
          }
          juzRevisionsByDate[dateKey].push(revision);
        });
      }
      
      // Second, organize sabaq para data by date
      const sabaqParaByDate: Record<string, any> = {};
      if (sabaqPara) {
        sabaqPara.forEach(para => {
          const dateKey = para.revision_date;
          sabaqParaByDate[dateKey] = para;
        });
      }
      
      // Third, organize progress entries by date
      const progressByDate: Record<string, any> = {};
      if (progressEntries) {
        progressEntries.forEach(progress => {
          if (progress.date) {
            const dateKey = progress.date;
            progressByDate[dateKey] = progress;
          }
        });
      }
      
      // Use dhor book entries as the primary source and attach related data
      if (dhorEntries && dhorEntries.length > 0) {
        combinedEntries = dhorEntries.map(entry => {
          const dateKey = entry.entry_date;
          // Attach juz revisions for this date
          const juzRevisionsForDate = juzRevisionsByDate[dateKey] || [];
          // Attach sabaq para for this date
          const sabaqParaForDate = sabaqParaByDate[dateKey];
          // Attach progress for this date
          const progressForDate = progressByDate[dateKey];
          
          return {
            ...entry,
            juz_revisions_data: juzRevisionsForDate,
            sabaq_para_data: sabaqParaForDate,
            progress_data: progressForDate,
            // Extract these fields from progress if available
            current_juz: progressForDate?.current_juz,
            current_surah: progressForDate?.current_surah,
            start_ayat: progressForDate?.start_ayat,
            end_ayat: progressForDate?.end_ayat,
            memorization_quality: progressForDate?.memorization_quality,
          } as DailyActivityEntry;
        });
      } else {
        // If no dhor book entries, create entries based on other data tables
        // Create a map of all dates that have any entries
        const allDates = new Set<string>();
        
        // Add dates from juz revisions
        Object.keys(juzRevisionsByDate).forEach(date => allDates.add(date));
        
        // Add dates from sabaq para
        Object.keys(sabaqParaByDate).forEach(date => allDates.add(date));
        
        // Add dates from progress
        Object.keys(progressByDate).forEach(date => allDates.add(date));
        
        // For each unique date, create an entry
        allDates.forEach(dateKey => {
          const juzRevisionsForDate = juzRevisionsByDate[dateKey] || [];
          const sabaqParaForDate = sabaqParaByDate[dateKey];
          const progressForDate = progressByDate[dateKey];
          
          if (juzRevisionsForDate.length > 0 || sabaqParaForDate || progressForDate) {
            combinedEntries.push({
              id: `synthetic-${dateKey}`,
              entry_date: dateKey,
              student_id: studentId,
              teacher_id: teacherId,
              comments: progressForDate?.notes || "",
              juz_revisions_data: juzRevisionsForDate,
              sabaq_para_data: sabaqParaForDate,
              progress_data: progressForDate,
              // Extract these fields from progress if available
              current_juz: progressForDate?.current_juz,
              current_surah: progressForDate?.current_surah,
              start_ayat: progressForDate?.start_ayat,
              end_ayat: progressForDate?.end_ayat,
              memorization_quality: progressForDate?.memorization_quality,
            } as DailyActivityEntry);
          }
        });
      }
      
      console.log(`Found ${combinedEntries.length} dhor book entries for the week`);
      console.log("Combined entries:", combinedEntries);
      return combinedEntries;
    },
    enabled: !!studentId,
  });

  // Update entries when data changes
  useEffect(() => {
    if (entriesData) {
      setEntries(entriesData);
    }
  }, [entriesData]);

  // Handle refresh request
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data refreshed",
        description: "The latest student records have been loaded.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "Could not load the latest data. Please try again.",
      });
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500); // Brief delay to show refresh indicator
    }
  };

  if (!studentId) {
    return (
      <Card className="p-6 text-center">
        <p>Please select a student to view their Dhor Book.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading Dhor Book entries...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      {/* Week Navigation Controls */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium text-sm sm:text-base">{formattedDateRange}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2 h-8 px-2"
            onClick={goToCurrentWeek}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-1 h-8 px-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </Button>
        </div>
        
        <Button variant="outline" size="sm" onClick={goToNextWeek}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* DhorBookGrid component displays entries in a weekly grid */}
      <DhorBookGrid 
        entries={entries} 
        studentId={studentId} 
        teacherId={teacherId} // Pass teacher ID for creating new entries
        currentWeek={currentWeek} 
        onRefresh={handleRefresh}
      />
    </Card>
  );
};
