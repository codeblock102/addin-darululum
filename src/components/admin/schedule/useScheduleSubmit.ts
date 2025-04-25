
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScheduleFormData } from "./scheduleValidation";

interface UseScheduleSubmitProps {
  schedule: any | null;
  onSuccess: () => void;
}

export const useScheduleSubmit = ({ schedule, onSuccess }: UseScheduleSubmitProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ScheduleFormData) => {
      const scheduleData = {
        name: formData.name,
        room: formData.room,
        capacity: formData.capacity,
        teacher_id: formData.teacher_id,
        time_slots: formData.time_slots,
        // Convert time_slots to days_of_week array for compatibility with existing code
        days_of_week: Array.from(
          new Set(formData.time_slots.flatMap(slot => slot.days))
        )
      };
      
      if (schedule) {
        const { data, error } = await supabase
          .from('classes')
          .update(scheduleData)
          .eq('id', schedule.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('classes')
          .insert([{
            ...scheduleData,
            current_students: 0
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      
      toast({
        title: schedule ? "Schedule updated" : "Schedule created",
        description: schedule 
          ? "The schedule has been updated successfully."
          : "A new schedule has been created successfully."
      });
      
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${schedule ? 'update' : 'create'} schedule: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};
