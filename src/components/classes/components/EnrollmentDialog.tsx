import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Loader2, X } from "lucide-react";
import { MultiSelect } from "@/components/ui/MultiSelect.tsx";
import { useState } from "react";
import { stripLovId } from "@/lib/stripLovId.tsx";

interface EnrollmentDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fetchEnrolledStudents = async (classId: string) => {
  const { data, error } = await supabase
    .from("students")
    .select("id, name")
    .contains("class_ids", [classId]);
  if (error) throw error;
  return data;
};

const fetchAllStudents = async () => {
  const { data, error } = await supabase.from("students").select("id, name");
  if (error) throw error;
  return data;
};

export const EnrollmentDialog = ({
  classId,
  open,
  onOpenChange,
}: EnrollmentDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const { data: enrolledStudents, isLoading: isLoadingEnrolled } = useQuery({
    queryKey: ["enrolledStudents", classId],
    queryFn: () => fetchEnrolledStudents(classId),
    enabled: !!classId,
  });

  const { data: allStudents, isLoading: isLoadingAllStudents } = useQuery({
    queryKey: ["allStudents"],
    queryFn: fetchAllStudents,
  });

  const enrollStudent = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const { error } = await supabase.rpc("append_class_to_students", {
        student_ids_to_update: studentIds,
        class_id_to_add: classId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["enrolledStudents", classId],
      });
      queryClient.invalidateQueries({ queryKey: ["allStudents"] });
      toast({ title: "Students enrolled successfully" });
      setSelectedStudentIds([]);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error enrolling students",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Full student enrollment error:", error);
    },
  });

  const unenrollStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.rpc("remove_class_from_student", {
        student_id_to_update: studentId,
        class_id_to_remove: classId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["enrolledStudents", classId],
      });
      queryClient.invalidateQueries({ queryKey: ["allStudents"] });
      toast({ title: "Student unenrolled successfully" });
    },
    onError: () => {
      toast({ title: "Error unenrolling student", variant: "destructive" });
    },
  });

  const studentOptions =
    allStudents
      ?.filter(
        (student) =>
          !enrolledStudents?.some(
            (enrolledStudent) => enrolledStudent.id === student.id
          )
      )
      .map((student) => ({
        value: student.id,
        label: student.name,
      })) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Student Enrollment</DialogTitle>
          <DialogDescription>
            Add or remove students from this class.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Enrolled Students</h3>
            {isLoadingEnrolled ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ul className="space-y-2 mt-2">
                {enrolledStudents?.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between"
                  >
                    <span>{student.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unenrollStudent.mutate(student.id)}
                      {...stripLovId({})}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium">Add Students</h3>
            <div className="flex items-center space-x-2 mt-2">
              <MultiSelect
                options={studentOptions || []}
                selected={selectedStudentIds}
                onChange={setSelectedStudentIds}
                placeholder="Select students"
                className="w-full"
              />
              <Button
                onClick={() =>
                  selectedStudentIds.length > 0 &&
                  enrollStudent.mutate(selectedStudentIds)
                }
                disabled={
                  selectedStudentIds.length === 0 || enrollStudent.isPending
                }
                {...stripLovId({})}
              >
                {enrollStudent.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Add Students"
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            {...stripLovId({})}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 