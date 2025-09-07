import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface StudentDeleteDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  studentToDelete: { id: string; name: string; studentId: string } | null;
  isDeleteType: "remove" | "delete";
}

export const StudentDeleteDialog = ({
  isOpen,
  setIsOpen,
  studentToDelete,
  isDeleteType,
}: StudentDeleteDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const removeStudentMutation = useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      const { error } = await supabase
        .from("students_teachers")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
      return assignmentId;
    },
    onSuccess: () => {
      toast({
        title: t("pages.teacherPortal.students.deleteDialog.toastRemovedTitle"),
        description: t("pages.teacherPortal.students.deleteDialog.toastRemovedDesc").replace("{name}", studentToDelete?.name || ""),
      });

      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-list"] });
      
      // Invalidate all student-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ["students-for-user"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-search"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-students"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      queryClient.invalidateQueries({ queryKey: ["students-for-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-progress"] });
      queryClient.invalidateQueries({ queryKey: ["students-search"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: t("pages.teacherPortal.students.deleteDialog.errorTitle"),
        description: `${t("pages.teacherPortal.students.deleteDialog.errorRemovePrefix")} ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (
      { studentId, studentName }: { studentId: string; studentName: string },
    ) => {
      console.log(
        `Starting deletion process for student: ${studentName} (ID: ${studentId})`,
      );

      // First, delete all attendance records for this student
      const { error: attendanceError } = await supabase
        .from("attendance")
        .delete()
        .eq("student_id", studentId);

      if (attendanceError) {
        console.error("Error deleting attendance records:", attendanceError);
        throw new Error(
          `Failed to delete attendance records: ${attendanceError.message}`,
        );
      }

      // Then, delete all progress records for this student
      const { error: progressError } = await supabase
        .from("progress")
        .delete()
        .eq("student_id", studentId);

      if (progressError) {
        console.error("Error deleting progress records:", progressError);
        throw new Error(
          `Failed to delete progress records: ${progressError.message}`,
        );
      }

      // Delete juz_revisions records
      const { error: juzRevisionsError } = await supabase
        .from("juz_revisions")
        .delete()
        .eq("student_id", studentId);

      if (juzRevisionsError) {
        console.error(
          "Error deleting juz_revisions records:",
          juzRevisionsError,
        );
        throw new Error(
          `Failed to delete juz_revisions records: ${juzRevisionsError.message}`,
        );
      }

      // Delete sabaq_para records
      const { error: sabaqParaError } = await supabase
        .from("sabaq_para")
        .delete()
        .eq("student_id", studentId);

      if (sabaqParaError) {
        console.error("Error deleting sabaq_para records:", sabaqParaError);
        throw new Error(
          `Failed to delete sabaq_para records: ${sabaqParaError.message}`,
        );
      }

      // Delete all teacher-student relationships
      const { error: relationshipError } = await supabase
        .from("students_teachers")
        .delete()
        .eq("student_name", studentName);

      if (relationshipError) {
        console.error(
          "Error deleting teacher-student relationships:",
          relationshipError,
        );
        throw new Error(
          `Failed to delete teacher-student relationships: ${relationshipError.message}`,
        );
      }

      // Finally, delete the student record
      const { error: studentError } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (studentError) {
        console.error("Error deleting student record:", studentError);
        throw new Error(
          `Failed to delete student record: ${studentError.message}`,
        );
      }

      console.log(`Successfully deleted student: ${studentName}`);
      return studentId;
    },
    onSuccess: () => {
      toast({
        title: t("pages.teacherPortal.students.deleteDialog.toastDeletedTitle"),
        description: t("pages.teacherPortal.students.deleteDialog.toastDeletedDesc").replace("{name}", studentToDelete?.name || ""),
      });

      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-list"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      
      // Invalidate all student-related queries to ensure UI updates everywhere
      queryClient.invalidateQueries({ queryKey: ["students-for-user"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-search"] });
      queryClient.invalidateQueries({ queryKey: ["classroom-students"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students"] });
      queryClient.invalidateQueries({ queryKey: ["students-for-assignment"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-for-progress"] });
      queryClient.invalidateQueries({ queryKey: ["students-search"] });
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Delete student mutation error:", error);
      toast({
        title: t("pages.teacherPortal.students.deleteDialog.errorTitle"),
        description: `${t("pages.teacherPortal.students.deleteDialog.errorDeletePrefix")} ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      if (isDeleteType === "remove") {
        removeStudentMutation.mutate({ assignmentId: studentToDelete.id });
      } else {
        deleteStudentMutation.mutate({
          studentId: studentToDelete.studentId,
          studentName: studentToDelete.name,
        });
      }
    }
  };

  const isLoading = removeStudentMutation.isPending ||
    deleteStudentMutation.isPending;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeleteType === "remove" ? t("pages.teacherPortal.students.deleteDialog.removeTitle") : t("pages.teacherPortal.students.deleteDialog.deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeleteType === "remove"
              ? t("pages.teacherPortal.students.deleteDialog.removeDesc").replace("{name}", studentToDelete?.name || "")
              : t("pages.teacherPortal.students.deleteDialog.deleteDesc").replace("{name}", studentToDelete?.name || "")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("pages.teacherPortal.students.deleteDialog.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isLoading
              ? (isDeleteType === "remove" ? t("pages.teacherPortal.students.deleteDialog.removing") : t("pages.teacherPortal.students.deleteDialog.deleting"))
              : (isDeleteType === "remove" ? t("pages.teacherPortal.students.deleteDialog.remove") : t("pages.teacherPortal.students.deleteDialog.delete"))}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
