
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
        title: "Student removed",
        description:
          `${studentToDelete?.name} has been removed from your students.`,
      });

      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-list"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async ({ studentId, studentName }: { studentId: string; studentName: string }) => {
      console.log(`Starting deletion process for student: ${studentName} (ID: ${studentId})`);
      
      // First, delete all attendance records for this student
      const { error: attendanceError } = await supabase
        .from("attendance")
        .delete()
        .eq("student_id", studentId);

      if (attendanceError) {
        console.error("Error deleting attendance records:", attendanceError);
        throw new Error(`Failed to delete attendance records: ${attendanceError.message}`);
      }

      // Then, delete all progress records for this student
      const { error: progressError } = await supabase
        .from("progress")
        .delete()
        .eq("student_id", studentId);

      if (progressError) {
        console.error("Error deleting progress records:", progressError);
        throw new Error(`Failed to delete progress records: ${progressError.message}`);
      }

      // Delete juz_revisions records
      const { error: juzRevisionsError } = await supabase
        .from("juz_revisions")
        .delete()
        .eq("student_id", studentId);

      if (juzRevisionsError) {
        console.error("Error deleting juz_revisions records:", juzRevisionsError);
        throw new Error(`Failed to delete juz_revisions records: ${juzRevisionsError.message}`);
      }

      // Delete sabaq_para records
      const { error: sabaqParaError } = await supabase
        .from("sabaq_para")
        .delete()
        .eq("student_id", studentId);

      if (sabaqParaError) {
        console.error("Error deleting sabaq_para records:", sabaqParaError);
        throw new Error(`Failed to delete sabaq_para records: ${sabaqParaError.message}`);
      }

      // Delete all teacher-student relationships
      const { error: relationshipError } = await supabase
        .from("students_teachers")
        .delete()
        .eq("student_name", studentName);

      if (relationshipError) {
        console.error("Error deleting teacher-student relationships:", relationshipError);
        throw new Error(`Failed to delete teacher-student relationships: ${relationshipError.message}`);
      }

      // Finally, delete the student record
      const { error: studentError } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (studentError) {
        console.error("Error deleting student record:", studentError);
        throw new Error(`Failed to delete student record: ${studentError.message}`);
      }

      console.log(`Successfully deleted student: ${studentName}`);
      return studentId;
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: `${studentToDelete?.name} has been permanently deleted from the system.`,
      });

      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      queryClient.invalidateQueries({ queryKey: ["all-students-list"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["all-students"] });
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Delete student mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
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
          studentName: studentToDelete.name 
        });
      }
    }
  };

  const isLoading = removeStudentMutation.isPending || deleteStudentMutation.isPending;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeleteType === "remove" ? "Remove Student" : "Delete Student"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeleteType === "remove" 
              ? `Are you sure you want to remove ${studentToDelete?.name} from your students? This will only remove the assignment, not delete the student from the system.`
              : `Are you sure you want to permanently delete ${studentToDelete?.name} from the system? This action cannot be undone and will remove all associated data including attendance records, progress, and revisions.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isLoading ? (isDeleteType === "remove" ? "Removing..." : "Deleting...") : (isDeleteType === "remove" ? "Remove" : "Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
