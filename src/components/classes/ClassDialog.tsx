import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { ClassFormData } from "./validation/classFormSchema.ts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useClassSubmit } from "./hooks/useClassSubmit.ts";
import { ClassForm } from "./components/ClassForm.tsx";
import { Teacher } from "@/types/teacher.ts";

export interface ClassDialogProps {
  onClose: () => void;
  selectedClass?: (Partial<ClassFormData> & { id: string }) | null;
}

const fetchTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "teacher");
  if (error) throw error;
  return data;
};

export const ClassDialog = ({ onClose, selectedClass }: ClassDialogProps) => {
  const { data: teachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: fetchTeachers,
  });

  const { mutate: submitClass, isPending: isSubmitting } = useClassSubmit({
    selectedClass: selectedClass ?? null,
    onSuccess: onClose,
  });

  return (
    <DialogContent className="max-h-[95vh] flex flex-col sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>
          {selectedClass ? "Edit Class" : "Add New Class"}
        </DialogTitle>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
        <ClassForm
          selectedClass={selectedClass || null}
          onSubmit={submitClass}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          teachers={teachers}
        />
      </div>
    </DialogContent>
  );
};
