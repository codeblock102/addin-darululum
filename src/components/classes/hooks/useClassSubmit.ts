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
        const daysOfWeek = Array.isArray(values.days_of_week)
          ? values.days_of_week
          : [];

        const classData = {
          name: values.name,
          capacity: values.capacity || 20,
          days_of_week: daysOfWeek,
          subject: values.subject,
          section: values.section,
          teacher_ids: values.teacher_ids || [],
          time_slots: [{
            days: daysOfWeek,
            start_time: values.time_start,
            end_time: values.time_end,
          }],
        };

        if (selectedClass) {
          const { error } = await supabase
            .from("classes")
            .update(classData)
            .eq("id", selectedClass.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("classes").insert([
            {
              ...classData,
              status: "active",
            },
          ]);
          if (error) throw error;
        }
      } catch (error) {
        console.error("Class submission error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Class saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      onSuccess();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to save class: ${errorMessage}`,
        variant: "destructive",
      });
      console.error("Full class submission error:", error);
    },
  });
};
