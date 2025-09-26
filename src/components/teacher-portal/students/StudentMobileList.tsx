import { Student, StudentAssignment as _StudentAssignment } from "../MyStudents.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Trash2, UserMinus, Edit } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface StudentMobileListProps {
  students: Student[];
  setStudentToDelete: (
    student: { id: string; name:string; studentId: string } | null,
  ) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
  setIsDeleteType: (type: "remove" | "delete") => void;
  onEditStudent?: (student: Student) => void;
}

export const StudentMobileList = ({
  students,
  setStudentToDelete,
  setIsDeleteDialogOpen,
  setIsDeleteType,
  onEditStudent,
}: StudentMobileListProps) => {
  const { t } = useI18n();

  const handleRemoveStudent = (_student: Student) => {
    return;
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete({
      id: "", // Not needed for complete deletion
      name: student.name,
      studentId: student.id,
    });
    setIsDeleteType("delete");
    setIsDeleteDialogOpen(true);
  };

  const isStudentAssigned = (_studentName: string) => {
    return false;
  };

  return (
    <div className="space-y-3 p-4">
      {students.map((student) => {
        const isAssigned = isStudentAssigned(student.name);
        return (
          <div
            key={student.id}
            className={`rounded-lg border p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow ${
              isAssigned
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
            onClick={() => onEditStudent?.(student)}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  isAssigned ? "bg-blue-600" : "bg-gray-400"
                }`}
              >
                {student.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{student.name}</h3>
                {isAssigned && (
                  <p className="text-sm text-blue-600">{t("pages.teacherPortal.students.mobile.assigned")}</p>
                )}
                <p className="text-sm text-gray-600">
                  {t("pages.teacherPortal.students.mobile.enrolledPrefix")} {student.enrollment_date
                    ? new Date(student.enrollment_date).toLocaleDateString()
                    : t("pages.teacherPortal.students.mobile.unknown")}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  student.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {student.status === "active" ? t("pages.teacherPortal.students.statusActive") : t("pages.teacherPortal.students.statusInactive")}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              {onEditStudent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when clicking the button
                    onEditStudent(student);
                  }}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 border-blue-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {t("pages.teacherPortal.students.mobile.edit")}
                </Button>
              )}
              {isAssigned && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveStudent(student);
                  }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  {t("pages.teacherPortal.students.mobile.remove")}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when clicking the button
                  handleDeleteStudent(student);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("pages.teacherPortal.students.mobile.delete")}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
