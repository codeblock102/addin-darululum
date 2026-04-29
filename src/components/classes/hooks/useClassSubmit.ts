import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
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
        const classTeacherIds = Array.isArray(values.teacher_ids) ? values.teacher_ids : [];

        // Build time_slots. If granular schedule_by_day provided, group by identical times & teacher set.
        let time_slots: { days: string[]; start_time: string; end_time: string; teacher_ids?: string[] }[] = [];

        if (Array.isArray((values as any).schedule_by_day) && (values as any).schedule_by_day.length > 0) {
          const entries: { day: string; start_time: string; end_time: string; teacher_ids?: string[] }[] = (values as any).schedule_by_day;
          type GroupKey = string;
          const groups = new Map<GroupKey, string[]>();
          for (const { day, start_time, end_time, teacher_ids } of entries) {
            const effTeacherIds = (Array.isArray(teacher_ids) && teacher_ids.length > 0) ? teacher_ids : classTeacherIds;
            const teacherKey = effTeacherIds.length > 0 ? effTeacherIds.slice().sort().join("|") : "";
            const key = `${start_time}__${end_time}__${teacherKey}`;
            const arr = groups.get(key) || [];
            arr.push(day);
            groups.set(key, arr);
          }
          time_slots = Array.from(groups.entries()).map(([key, days]) => {
            const [start_time, end_time, teacherKey] = key.split("__");
            const teacher_ids = teacherKey ? teacherKey.split("|") : undefined;
            return { days, start_time, end_time, teacher_ids };
          });
        } else {
          time_slots = [{
            days: daysOfWeek,
            start_time: values.time_start,
            end_time: values.time_end,
            teacher_ids: classTeacherIds,
          }];
        }

        const classData = {
          name: values.name,
          capacity: values.capacity || 20,
          days_of_week: daysOfWeek,
          subject: values.subject,
          section: values.section,
          teacher_ids: classTeacherIds,
          time_slots,
        } as any;

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
