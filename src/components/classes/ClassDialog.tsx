import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useClassSubmit } from "./hooks/useClassSubmit.ts";
import { ClassFormData } from "./validation/classFormSchema.ts";
import { useQueryClient, useToast } from "react-query";

interface ClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classToEdit: (Partial<ClassFormData> & { id: string }) | null;
}

export const ClassDialog = ({ isOpen, onClose, classToEdit }: ClassDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch teachers for the dropdown
  const { data: teachers = [] } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, name, subject")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  const classMutation = useClassSubmit({
    selectedClass: classToEdit,
    onSuccess: onClose,
  });

  const handleSubmit = (values: ClassFormData) => {
    classMutation.mutate(values);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {classToEdit ? "Edit Class" : "Create New Class"}
        </DialogTitle>
        <DialogDescription>
          {classToEdit
            ? "Update the class details and schedule."
            : "Add a new class with its schedule."}
        </DialogDescription>
      </DialogHeader>

      <ClassForm
        selectedClass={classToEdit}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={classMutation.isPending}
        teachers={teachers}
      />
    </DialogContent>
  );
}
