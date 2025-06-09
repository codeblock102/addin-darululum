
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, UserPlus, UserMinus } from "lucide-react";
import { Student, StudentAssignment } from "../MyStudents.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

interface StudentTableProps {
  students: Student[];
  assignedStudents?: StudentAssignment[];
  setStudentToDelete: (student: { id: string; name: string; studentId: string } | null) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  setIsDeleteType: (type: "remove" | "delete") => void;
}

export const StudentTable = ({
  students,
  assignedStudents = [],
  setStudentToDelete,
  setIsDeleteDialogOpen,
  setIsDeleteType,
}: StudentTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStudentMutation = useMutation({
    mutationFn: async ({ teacherId, studentName }: { teacherId: string; studentName: string }) => {
      const { error } = await supabase
        .from("students_teachers")
        .insert({
          teacher_id: teacherId,
          student_name: studentName,
          active: true,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Student added",
        description: `${variables.studentName} has been added to your students.`,
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-student-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = (studentName: string) => {
    // Get teacherId from localStorage or context - this is a simplified version
    const teacherId = "temp-teacher-id"; // This should come from your auth context
    addStudentMutation.mutate({ teacherId, studentName });
  };

  const handleRemoveStudent = (student: Student) => {
    const assignment = assignedStudents.find(a => a.student_name === student.name);
    if (assignment) {
      setStudentToDelete({
        id: assignment.id,
        name: student.name,
        studentId: student.id,
      });
      setIsDeleteType("remove");
      setIsDeleteDialogOpen(true);
    }
  };

  const isStudentAssigned = (studentName: string) => {
    return assignedStudents.some(assignment => assignment.student_name === studentName);
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">Student</TableHead>
            <TableHead className="font-semibold text-gray-700">Enrollment Date</TableHead>
            <TableHead className="font-semibold text-gray-700">Status</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const isAssigned = isStudentAssigned(student.name);
            return (
              <TableRow
                key={student.id}
                className={`transition-colors hover:bg-gray-50 ${
                  isAssigned ? 'bg-blue-50' : ''
                }`}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      isAssigned ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{student.name}</div>
                      {isAssigned && (
                        <div className="text-sm text-blue-600">Assigned to you</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  {student.enrollment_date
                    ? new Date(student.enrollment_date).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      student.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {student.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {isAssigned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveStudent(student)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddStudent(student.name)}
                      disabled={addStudentMutation.isPending}
                      className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      {addStudentMutation.isPending ? "Adding..." : "Add"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
