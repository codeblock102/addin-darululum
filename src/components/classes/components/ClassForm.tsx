import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import { ClassFormData, classSchema } from "../validation/classFormSchema.ts";
import { ClassFormFields } from "./ClassFormFields.tsx";
import { Teacher } from "@/types/teacher.ts";
import { useEffect } from "react";

interface ClassFormProps {
  selectedClass: (Partial<ClassFormData> & { id?: string }) | null;
  onSubmit: (data: ClassFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  teachers?: Teacher[];
}

export const ClassForm = ({
  selectedClass,
  onSubmit,
  onCancel,
  isSubmitting,
  teachers,
}: ClassFormProps) => {
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: selectedClass?.name || "",
      teacher_ids: selectedClass?.teacher_ids || [],
      time_start: selectedClass?.time_start || "09:00",
      time_end: selectedClass?.time_end || "10:30",
      capacity: selectedClass?.capacity || 20,
      days_of_week: selectedClass?.days_of_week || [],
      subject: selectedClass?.subject || "",
      section: selectedClass?.section || "",
      schedule_by_day: [],
    },
  });

  useEffect(() => {
    if (selectedClass) {
      const timeSlots = selectedClass.time_slots || [];
      // Convert time_slots into schedule_by_day entries, preserve per-slot teacher_ids if present
      const scheduleByDay = timeSlots.flatMap((slot: any) =>
        (slot?.days || []).map((day: string) => ({
          day,
          start_time: slot?.start_time || "09:00",
          end_time: slot?.end_time || "10:30",
          teacher_ids: Array.isArray(slot?.teacher_ids) ? slot.teacher_ids : undefined,
        }))
      );
      form.reset({
        name: selectedClass.name || "",
        teacher_ids: selectedClass.teacher_ids || [],
        time_start: (timeSlots[0]?.start_time as string) || "09:00",
        time_end: (timeSlots[0]?.end_time as string) || "10:30",
        capacity: selectedClass.capacity || 20,
        days_of_week: selectedClass.days_of_week || [],
        subject: selectedClass.subject || "",
        section: selectedClass.section || "",
        schedule_by_day: scheduleByDay,
      });
    }
  }, [selectedClass, form.reset]);

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          <ClassFormFields teachers={teachers} />

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedClass ? "Updating..." : "Creating..."}
                  </>
                )
                : (
                  selectedClass ? "Update Class" : "Create Class"
                )}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
};
