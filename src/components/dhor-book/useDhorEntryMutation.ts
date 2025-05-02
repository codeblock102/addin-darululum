
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
      const { data, error } = await supabase
        .from('dhor_book_entries')
        .insert([{
          student_id: studentId,
          teacher_id: teacherId,
          entry_date: formData.entry_date,
          day_of_week: new Date(formData.entry_date).toLocaleDateString('en-US', { weekday: 'long' }),
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
    
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dhor-book-entries'] });
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
