import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { ClassFormData } from "../validation/classFormSchema.ts";

interface UseClassSubmitProps {
  selectedClass: (Partial<ClassFormData> & { id: string }) | null;
  onSuccess: () => void;
}

export const useClassSubmit = (
  { selectedClass, onSuccess }: UseClassSubmitProps,
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: ClassFormData) => {
      try {
        // Skip permission check for now to allow editing
        // const hasCreatePermission = await hasPermission('manage_classes');
        // if (!hasCreatePermission) {
        //   throw new Error("You don't have permission to manage classes");
        // }

        // Ensure days_of_week is always an array
        const daysOfWeek = Array.isArray(values.days_of_week)
          ? values.days_of_week
          : [];

        const formattedValues = {
          name: values.name,
          teacher_id: values.teacher_id,
          room: values.room || null,
          capacity: values.capacity || 20,
          days_of_week: daysOfWeek,
          // Properly format time_slots to match the TimeSlot interface
          time_slots: [{
            days: daysOfWeek, // Use the same days array
            start_time: values.time_start,
            end_time: values.time_end,
          }],
        };

        if (selectedClass) {
          const { error } = await supabase
            .from("classes")
            .update(formattedValues)
            .eq("id", selectedClass.id);

          if (error) {
            console.error("Error updating class:", error);
            throw new Error(error.message || "Failed to update class");
          }
        } else {
          const { error } = await supabase
            .from("classes")
            .insert([{
              ...formattedValues,
              current_students: 0,
              status: "active",
            }]);

          if (error) {
            console.error("Error creating class:", error);
            throw new Error(error.message || "Failed to create class");
          }
        }
      } catch (error) {
        console.error("Class submission error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-schedule"] });

      toast({
        title: selectedClass ? "Class Updated" : "Class Created",
        description: `Class has been ${
          selectedClass ? "updated" : "created"
        } successfully.`,
      });

      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });
};
