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

const fetchClassData = async (classId: string) => {
  const { data, error } = await supabase
    .from("classes")
    .select("current_students")
    .eq("id", classId)
    .single();

  if (error) throw error;
  return data;
};

const fetchStudentDetails = async (studentIds: string[]) => {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .select("id, name")
    .in("id", studentIds);

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

  const { data: classData, isLoading: isLoadingClass } = useQuery({
    queryKey: ["classData", classId],
    queryFn: () => fetchClassData(classId),
    enabled: !!classId,
  });

  const { data: enrolledStudents, isLoading: isLoadingEnrolled } = useQuery({
    queryKey: ["enrolledStudents", classId, classData?.current_students],
    queryFn: () => fetchStudentDetails(classData?.current_students || []),
    enabled: !!classData,
  });

  const { data: allStudents, isLoading: _isLoadingAllStudents } = useQuery({
    queryKey: ["allStudents"],
    queryFn: fetchAllStudents,
  });

  const updateEnrollments = useMutation({
    mutationFn: async (updatedStudentIds: string[]) => {
      const { error } = await supabase
        .from("classes")
        .update({ current_students: updatedStudentIds })
        .eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classData", classId] });
      queryClient.invalidateQueries({
        queryKey: ["enrolledStudents", classId, classData?.current_students],
      });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Enrollment updated successfully" });
      setSelectedStudentIds([]);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error updating enrollment",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Full enrollment update error:", error);
    },
  });

  const handleEnroll = () => {
    const currentStudentIds = classData?.current_students || [];
    const newStudentIds = [
      ...new Set([...currentStudentIds, ...selectedStudentIds]),
    ];
    updateEnrollments.mutate(newStudentIds);
  };

  const handleUnenroll = (studentId: string) => {
    const updatedStudentIds =
      classData?.current_students?.filter((id: string) => id !== studentId) || [];
    updateEnrollments.mutate(updatedStudentIds);
  };

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
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Student Enrollment</DialogTitle>
          <DialogDescription>
            Add or remove students from this class.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <h3 className="text-lg font-medium">Enrolled Students</h3>
            {isLoadingClass || isLoadingEnrolled ? (
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
                      onClick={() => handleUnenroll(student.id)}
                      {...stripLovId({})}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sticky bottom-0 bg-background pt-2">
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
                onClick={handleEnroll}
                disabled={
                  selectedStudentIds.length === 0 ||
                  updateEnrollments.isPending
                }
                {...stripLovId({})}
              >
                {updateEnrollments.isPending ? (
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