
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
      // First, insert into the dhor_book_entries table
      const { data: dhorData, error: dhorError } = await supabase
        .from('dhor_book_entries')
        .insert([{
          student_id: studentId,
          teacher_id: teacherId,
          entry_date: formData.entry_date,
          day_of_week: formData.day_of_week || new Date(formData.entry_date).toLocaleDateString('en-US', { weekday: 'long' }),
          sabak: formData.sabak,
          sabak_para: formData.sabak_para,
          dhor_1: formData.dhor_1,
          dhor_1_mistakes: formData.dhor_1_mistakes || 0,
          dhor_2: formData.dhor_2,
          dhor_2_mistakes: formData.dhor_2_mistakes || 0,
          comments: formData.comments,
          points: formData.points || 0,
          detention: formData.detention || false
        }])
        .select();
    
      if (dhorError) throw dhorError;

      // Check if we have progress data to sync
      if (formData.current_surah || formData.current_juz || formData.memorization_quality) {
        // Also insert into the progress table to maintain compatibility
        const { error: progressError } = await supabase
          .from('progress')
          .insert([{
            student_id: studentId,
            date: formData.entry_date,
            current_surah: formData.current_surah,
            current_juz: formData.current_juz,
            verses_memorized: formData.verses_memorized,
            memorization_quality: formData.memorization_quality,
            tajweed_level: formData.tajweed_level,
            revision_status: formData.revision_status,
            teacher_notes: formData.teacher_notes || formData.comments
          }]);

        if (progressError) {
          console.error("Error syncing to progress table:", progressError);
          // Do not throw, we already saved the dhor entry
        }
      }

      // If we have schedule data, create a revision schedule
      if (formData.schedule_date) {
        const { error: scheduleError } = await supabase
          .from('revision_schedule')
          .insert([{
            student_id: studentId,
            juz_number: formData.current_juz || 1,
            surah_number: formData.current_surah,
            scheduled_date: formData.schedule_date,
            priority: formData.schedule_priority || 'medium',
            status: formData.schedule_status || 'pending',
            notes: formData.schedule_notes || formData.comments
          }]);

        if (scheduleError) {
          console.error("Error creating revision schedule:", scheduleError);
          // Do not throw, we already saved the dhor entry
        }
      }

      return dhorData;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dhor-book-entries'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['student-progress'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-summary'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['revision-schedule'] });
      
      onSuccess?.(data);
      toast({
        title: "Success",
        description: "Dhor book entry created successfully."
      });
    },
    onError: (error) => {
      console.error('Error creating entry:', error);
      toast({
        title: "Error",
        description: "Failed to create entry. Please try again.",
        variant: "destructive"
      });
    }
  });

  return { mutate, isPending };
}
