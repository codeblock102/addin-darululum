import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, User, UserCheck } from "lucide-react";
import { Student, StudentAssignment } from "../MyStudents";

interface StudentMobileListProps {
  students: Student[];
  assignedStudents: StudentAssignment[] | undefined;
  setStudentToDelete: (
    student: { id: string; name: string; studentId: string } | null,
  ) => void;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  setIsDeleteType: (type: "remove" | "delete") => void;
}

export const StudentMobileList = ({
  students,
  assignedStudents,
  setStudentToDelete,
  setIsDeleteDialogOpen,
  setIsDeleteType,
}: StudentMobileListProps) => {
  const navigate = useNavigate();

  // Handle click on "View Progress" button
  const handleViewProgress = (studentId: string) => {
    navigate(`/teacher-portal?tab=dhor-book&studentId=${studentId}`);
  };

  // Handle click on delete button
  const handleDeleteClick = (
    student: Student,
    deleteType: "remove" | "delete",
  ) => {
    const assignment = assignedStudents?.find((a) =>
      a.student_name === student.name
    );
    if (assignment) {
      setStudentToDelete({
        id: assignment.id,
        name: student.name,
        studentId: student.id,
      });
      setIsDeleteType(deleteType);
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    <div className="grid gap-2 px-4 pb-4">
      {students.map((student) => (
        <div
          key={student.id}
          className="border rounded-lg p-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{student.name}</span>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                student.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {student.status || "N/A"}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Enrolled: {student.enrollment_date
              ? new Date(student.enrollment_date).toLocaleDateString()
              : "N/A"}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleViewProgress(student.id)}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              View Progress
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                onClick={() => handleDeleteClick(student, "remove")}
                title="Remove from your students"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => handleDeleteClick(student, "delete")}
                title="Delete student from database"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
