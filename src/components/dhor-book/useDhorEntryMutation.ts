import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getStartOfWeekISO } from "@/utils/dateUtils";

interface UseDhorEntryMutationProps {
  studentId: string;
  teacherId: string;
  onSuccess?: (data?: any) => void;
}

export function useDhorEntryMutation({ 
  studentId, 
  teacherId, 
  onSuccess 
}: UseDhorEntryMutationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: any) => {
      console.log("Creating new dhor book entry with data:", JSON.stringify(formData, null, 2));
      
      try {
        // Strip out any fields that don't belong in dhor_book_entries table
        const dhorBookFields = { ...formData };
        // Remove fields that should go to progress table
        delete dhorBookFields.current_juz;
        delete dhorBookFields.current_surah;
        delete dhorBookFields.start_ayat;
        delete dhorBookFields.end_ayat;
        delete dhorBookFields.progress;
        delete dhorBookFields.memorization_quality;
        delete dhorBookFields.tajweed_level;
        delete dhorBookFields.revision_status;
        delete dhorBookFields.teacher_notes;
        
        console.log("Filtered dhor_book_entries fields:", JSON.stringify(dhorBookFields, null, 2));
        
        // First, insert into the dhor_book_entries table
        const { data: dhorData, error: dhorError } = await supabase
          .from('dhor_book_entries')
          .insert([{
            student_id: studentId,
            teacher_id: teacherId,
            entry_date: dhorBookFields.entry_date,
            day_of_week: dhorBookFields.day_of_week || new Date(dhorBookFields.entry_date || Date.now()).toLocaleDateString('en-US', { weekday: 'long' }),
            sabak_para: dhorBookFields.sabak_para,
            sabaq_para_juz: dhorBookFields.sabaq_para_juz,
            sabaq_para_pages: dhorBookFields.sabaq_para_pages,
            dhor_1: dhorBookFields.dhor_1,
            dhor_1_mistakes: dhorBookFields.dhor_1_mistakes || 0,
            dhor_2: dhorBookFields.dhor_2,
            dhor_2_mistakes: dhorBookFields.dhor_2_mistakes || 0,
            dhor_juz: dhorBookFields.dhor_juz,
            dhor_quarter_start: dhorBookFields.dhor_quarter_start,
            dhor_quarters_covered: dhorBookFields.dhor_quarters_covered,
            comments: dhorBookFields.comments,
            points: dhorBookFields.points || 0,
            detention: dhorBookFields.detention || false
          }])
          .select();
      
        if (dhorError) {
          console.error("Error creating dhor book entry:", dhorError);
          console.error("Error details:", JSON.stringify(dhorError, null, 2));
          throw new Error(`Failed to insert dhor entry: ${dhorError.message}`);
        }

        if (!dhorData || dhorData.length === 0) {
          console.error("No data returned after insertion. This may indicate a permission issue.");
          throw new Error("Database insertion completed but no data was returned");
        }

        console.log("Successfully created dhor book entry:", dhorData);

        // Check if we have explicit progress data from the form to sync
        if (
          formData.entry_date && // Ensure we have a date to link
          formData.current_juz !== undefined && 
          formData.current_surah !== undefined && 
          formData.start_ayat !== undefined && 
          formData.end_ayat !== undefined
        ) {
          try {
            // Create the progress record using only the fields explicitly provided in formData
            const progressRecord = {
              student_id: studentId,
              date: formData.entry_date, // Use the entry_date from the main form submission
              current_surah: formData.current_surah,
              current_juz: formData.current_juz,
              start_ayat: formData.start_ayat,
              end_ayat: formData.end_ayat,
              // Include other relevant progress fields if they exist in formData
              memorization_quality: formData.memorization_quality,
              revision_status: formData.revision_status,
              teacher_notes: formData.teacher_notes || formData.comments
            };
            
            // Filter out any undefined/null values before insertion
            const cleanProgressRecord = Object.fromEntries(
              Object.entries(progressRecord).filter(([_, v]) => v !== undefined && v !== null)
            );

            console.log("Inserting CLEANED progress record from explicit form data:", JSON.stringify(cleanProgressRecord, null, 2));
            
            // Insert the cleaned progress record
            const progressResult = await supabase
              .from('progress')
              .insert([cleanProgressRecord])
              .select();

            if (progressResult.error) {
              console.error("Error syncing progress data to progress table:", progressResult.error);
              console.error("Progress error details:", JSON.stringify(progressResult.error, null, 2));
            } else {
              console.log("Successfully added progress data from form:", progressResult.data);
            }
          } catch (progressInsertError) {
            console.error("Exception during progress insertion:", progressInsertError);
          }
        } else {
          console.log("Skipping progress table insertion because complete Sabaq data (Juz, Surah, Start/End Ayat, Date) was not found in form submission:", {
            date: formData.entry_date,
            juz: formData.current_juz,
            surah: formData.current_surah,
            start: formData.start_ayat,
            end: formData.end_ayat
          });
        }

        // If we have schedule data, create a revision schedule
        if (formData.schedule_date) {
          try {
            const { data: scheduleData, error: scheduleError } = await supabase
              .from('revision_schedule')
              .insert([{
                student_id: studentId,
                juz_number: formData.current_juz || 1,
                surah_number: formData.current_surah,
                scheduled_date: formData.schedule_date,
                priority: formData.schedule_priority || 'medium',
                status: formData.schedule_status || 'pending',
                notes: formData.schedule_notes || formData.comments
              }])
              .select();

            if (scheduleError) {
              console.error("Error creating revision schedule:", scheduleError);
              console.error("Schedule error details:", JSON.stringify(scheduleError, null, 2));
              // Do not throw, we already saved the dhor entry
            } else {
              console.log("Successfully added schedule data:", scheduleData);
            }
          } catch (scheduleInsertError) {
            console.error("Exception during schedule insertion:", scheduleInsertError);
          }
        }

        return dhorData;
      } catch (error) {
        console.error("Exception in mutation function:", error);
        console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace available');
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries with more specific keys
      console.log("Mutation succeeded, invalidating queries");
      
      // Get the entry date from the returned data
      const entryDate = data?.[0]?.entry_date;
      if (entryDate) {
        // Convert to Date object to get the week start/end for precise invalidation
        const entryDateObj = new Date(entryDate);
        const entryWeekISO = getStartOfWeekISO(entryDateObj);
        
        console.log(`Entry date: ${entryDate}, week start ISO: ${entryWeekISO}`);
        
        // Invalidate the specific week for this entry - Force a refetch
        queryClient.invalidateQueries({ 
          queryKey: ['dhor-book-entries', studentId, entryWeekISO],
          refetchType: 'all'
        });
      }
      
      // Always invalidate these broader queries with refetch
      queryClient.invalidateQueries({ 
        queryKey: ['dhor-book-entries', studentId],
        refetchType: 'all'
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['dhor-book-summary', studentId],
        refetchType: 'all'
      });
      
      // Also invalidate the broader queries
      queryClient.invalidateQueries({ 
        queryKey: ['dhor-book-entries'],
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ queryKey: ['progress'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['student-progress'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['teacher-summary'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['revision-schedule'], refetchType: 'all' });
      
      // Call the onSuccess callback
      onSuccess?.(data);
      
      toast({
        title: "Success",
        description: "Dhor book entry created successfully."
      });
    },
    onError: (error) => {
      console.error('Error creating entry:', error);
      
      // Check if it's a Supabase error with details
      let errorMessage = "Failed to create entry. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error stack:', error.stack);
      }
      
      // Show more specific error to user
      toast({
        title: "Database Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  return { mutate, isPending };
}
