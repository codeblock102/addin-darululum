
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

  // Teachers should only be able to remove students from their assignments, not delete them entirely
  const handleConfirmDelete = () => {
    if (studentToDelete) {
      // For teachers, we always remove the assignment, regardless of isDeleteType
      removeStudentMutation.mutate({ assignmentId: studentToDelete.id });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Remove Student
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {studentToDelete?.name} from your students? 
            This will only remove the assignment, not delete the student from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {removeStudentMutation.isPending ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
