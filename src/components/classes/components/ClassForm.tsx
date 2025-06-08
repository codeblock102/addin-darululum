import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import { classSchema, ClassFormData } from "../validation/classFormSchema.ts";
import { ClassFormFields } from "./ClassFormFields.tsx";
import { Teacher } from "@/types/teacher.ts";

interface ClassFormProps {
  selectedClass: Partial<ClassFormData> | null;
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
  teachers 
}: ClassFormProps) => {
  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: selectedClass?.name || "",
      teacher_id: selectedClass?.teacher_id || "",
      room: selectedClass?.room || "",
      time_start: selectedClass?.time_start || "09:00",
      time_end: selectedClass?.time_end || "10:30",
      capacity: selectedClass?.capacity || 20,
      days_of_week: selectedClass?.days_of_week || [],
    },
  });

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ClassFormFields teachers={teachers} />
          
          <div className="flex justify-end gap-2">
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
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedClass ? "Updating..." : "Creating..."}
                </>
              ) : (
                selectedClass ? "Update Class" : "Create Class"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
};
