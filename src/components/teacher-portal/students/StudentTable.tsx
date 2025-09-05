import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, UserMinus as _UserMinus, UserPlus as _UserPlus, Edit } from "lucide-react";
import { Student, StudentAssignment as _StudentAssignment } from "../MyStudents.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { getErrorMessage } from "@/utils/stringUtils.ts";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface StudentTableProps {
  students: Student[];
  setStudentToDelete: (
    student: { id: string; name: string; studentId: string } | null,
  ) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  setIsDeleteType: (type: "remove" | "delete") => void;
  onEditStudent?: (student: Student) => void;
}

export const StudentTable = ({
  students,
  setStudentToDelete,
  setIsDeleteDialogOpen,
  setIsDeleteType,
  onEditStudent,
}: StudentTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const _addStudentMutation = useMutation({
    mutationFn: async (
      { teacherId, studentName }: { teacherId: string; studentName: string },
    ) => {
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
        title: t("pages.teacherPortal.students.addToastTitle"),
        description: t("pages.teacherPortal.students.addToastDesc").replace("{name}", variables.studentName),
      });
      queryClient.invalidateQueries({
        queryKey: ["teacher-student-assignments"],
      });
      queryClient.invalidateQueries({ queryKey: ["teacher-students-details"] });
      
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
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error, t("pages.teacherPortal.students.errorAddDefault"));
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete({
      id: "", // Not needed for complete deletion
      name: student.name,
      studentId: student.id,
    });
    setIsDeleteType("delete");
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">
              {t("pages.teacherPortal.students.table.student")}
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              {t("pages.teacherPortal.students.table.enrollmentDate")}
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              {t("pages.teacherPortal.students.table.status")}
            </TableHead>
            <TableHead className="text-right font-semibold text-gray-700">
              {t("pages.teacherPortal.students.table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            return (
              <TableRow
                key={student.id}
                className="transition-colors hover:bg-gray-50 cursor-pointer"
                onClick={() => onEditStudent?.(student)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold bg-blue-600"
                    >
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {student.name}
                      </div>
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
                    {student.status === "active" ? t("pages.teacherPortal.students.statusActive") : t("pages.teacherPortal.students.statusInactive")}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEditStudent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click when clicking the button
                          onEditStudent(student);
                        }}
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("pages.teacherPortal.students.table.edit")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click when clicking the button
                        handleDeleteStudent(student);
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("pages.teacherPortal.students.table.delete")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
