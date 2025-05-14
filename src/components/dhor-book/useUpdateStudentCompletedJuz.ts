import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UpdateCompletedJuzArgs {
  studentId: string;
  newlyCompletedJuz: number;
}

export function useUpdateStudentCompletedJuz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ studentId, newlyCompletedJuz }: UpdateCompletedJuzArgs) => {
      // 1. Fetch the ID and current completed_juz array of the most recent progress entry
      const { data: latestProgressEntry, error: fetchError } = await supabase
        .from('progress')
        .select('id, completed_juz')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching latest progress entry:', fetchError);
        throw new Error('Failed to fetch latest progress entry: ' + fetchError.message);
      }

      if (!latestProgressEntry) {
        console.warn('No progress entry found for student to update completed_juz.');
        // Depending on requirements, we might want to create one or handle this differently
        // For now, we'll just return, as there's no record to update.
        // Or, if the `progress` table might not have any entries yet, but `students` table has `completed_juz`
        // this logic would need to target the `students` table.
        // Based on user prompt, targeting `progress` table.
        return { message: "No progress entry to update." };
      }

      const currentCompletedJuz = (latestProgressEntry.completed_juz || []) as number[];
      
      if (currentCompletedJuz.includes(newlyCompletedJuz)) {
        console.log(`Juz ${newlyCompletedJuz} already in completed_juz array.`);
        return { message: `Juz ${newlyCompletedJuz} already marked as completed.` };
      }

      const updatedCompletedJuz = [...currentCompletedJuz, newlyCompletedJuz].sort((a,b) => a-b);

      // 2. Update the most recent progress entry with the new array
      const { error: updateError } = await supabase
        .from('progress')
        .update({ completed_juz: updatedCompletedJuz as any })
        .eq('id', latestProgressEntry.id);

      if (updateError) {
        console.error('Error updating completed_juz:', updateError);
        throw new Error('Failed to update completed_juz: ' + updateError.message);
      }

      // Return a success message or potentially the updated array if needed elsewhere
      return { message: `Juz ${newlyCompletedJuz} marked as completed.` };
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Juz Completion Updated",
        description: data.message || `Juz ${variables.newlyCompletedJuz} marked as completed.`,
      });
      // Invalidate queries that depend on student's overall progress or completed Juz list
      queryClient.invalidateQueries({ queryKey: ['student-juz-progress', variables.studentId] });
      // If you have other queries that show completed_juz list from student summary, invalidate them too.
      // e.g., queryClient.invalidateQueries({ queryKey: ['student-summary', variables.studentId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update Juz completion status.",
        variant: "destructive",
      });
    },
  });
} 