import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button.tsx";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { StudentForm } from "./StudentForm.tsx";
import { useStudentSubmit } from "./useStudentSubmit.ts";
import { StudentFormData } from "./studentTypes.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface AddStudentDialogProps {
  teacherId: string;
}

export const AddStudentDialog = ({ teacherId }: AddStudentDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const initialFormData: StudentFormData = {
    studentName: "",
    dateOfBirth: "",
    enrollmentDate: new Date().toISOString().split("T")[0],
    guardianName: "",
    guardianContact: "",
    guardianEmail: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalConditions: "",
    status: "active",
    completedJuz: [],
    currentJuz: "_none_",
  };

  const { handleSubmit, isProcessing } = useStudentSubmit({
    teacherId,
    onSuccess: () => {
      toast({
        title: t("pages.teacherPortal.students.addToastTitle"),
        description: t("pages.teacherPortal.students.addToastDesc").replace("{name}", ""),
      });
      setOpen(false);

      // Refresh queries to show the new student
      queryClient.invalidateQueries({
        queryKey: ["teacher-assigned-students"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      
      // Invalidate all student-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ["students-for-user"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-search"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-students"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      queryClient.invalidateQueries({ queryKey: ["students-for-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-progress"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-list"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-selector"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-bulk"] });
      queryClient.invalidateQueries({ queryKey: ["students-search"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          {t("pages.teacherPortal.students.table.add", "Add Student")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("pages.teacherPortal.students.addDialog.title", "Add New Student")}</DialogTitle>
          <DialogDescription>{t("pages.teacherPortal.students.addDialog.description", "Enter student details below. You can add more information in the different tabs.")}</DialogDescription>
        </DialogHeader>

        <StudentForm
          initialFormData={initialFormData}
          onSubmit={handleSubmit}
          isProcessing={isProcessing}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
