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

        // Build time_slots. If granular schedule_by_day provided, group by identical times.
        let time_slots: { days: string[]; start_time: string; end_time: string }[] = [];

        if (Array.isArray((values as any).schedule_by_day) && (values as any).schedule_by_day.length > 0) {
          const entries: { day: string; start_time: string; end_time: string }[] = (values as any).schedule_by_day;
          const groups = new Map<string, string[]>();
          for (const { day, start_time, end_time } of entries) {
            const key = `${start_time}__${end_time}`;
            const arr = groups.get(key) || [];
            arr.push(day);
            groups.set(key, arr);
          }
          time_slots = Array.from(groups.entries()).map(([key, days]) => {
            const [start_time, end_time] = key.split("__");
            return { days, start_time, end_time };
          });
        } else {
          time_slots = [{
            days: daysOfWeek,
            start_time: values.time_start,
            end_time: values.time_end,
          }];
        }

        const classData = {
          name: values.name,
          capacity: values.capacity || 20,
          days_of_week: daysOfWeek,
          subject: values.subject,
          section: values.section,
          teacher_ids: values.teacher_ids || [],
          time_slots,
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
