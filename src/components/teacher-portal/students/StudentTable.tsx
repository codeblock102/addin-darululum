
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { User, UserCheck, Trash2 } from "lucide-react";
import { Student, StudentAssignment } from "../MyStudents";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTable } from "@/components/mobile/MobileTable";

interface StudentTableProps {
  students: Student[];
  assignedStudents: StudentAssignment[] | undefined;
  setStudentToDelete: (student: { id: string, name: string, studentId: string } | null) => void;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  setIsDeleteType: (type: 'remove' | 'delete') => void;
}

export const StudentTable = ({ 
  students, 
  assignedStudents,
  setStudentToDelete,
  setIsDeleteDialogOpen,
  setIsDeleteType
}: StudentTableProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Handle click on "View Progress" button
  const handleViewProgress = (studentId: string) => {
    navigate(`/teacher-portal?tab=dhor-book&studentId=${studentId}`);
  };
  
  // Handle click on delete button
  const handleDeleteClick = (student: Student, deleteType: 'remove' | 'delete') => {
    const assignment = assignedStudents?.find(a => a.student_name === student.name);
    if (assignment) {
      setStudentToDelete({ id: assignment.id, name: student.name, studentId: student.id });
      setIsDeleteType(deleteType);
      setIsDeleteDialogOpen(true);
    }
  };

  if (isMobile) {
    const columns = [
      { 
        key: "name",
        title: "Name",
        isPrimary: true,
        render: (value: string) => (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{value}</span>
          </div>
        )
      },
      { 
        key: "enrollment_date",
        title: "Enrollment Date",
        render: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A',
        isSecondary: true
      },
      { 
        key: "status",
        title: "Status",
        isStatus: true,
        statusMap: {
          active: { label: "Active", variant: "success" },
          inactive: { label: "Inactive", variant: "danger" }
        }
      }
    ];

    const getActions = (student: Student) => [
      {
        label: "View Progress",
        onClick: () => handleViewProgress(student.id),
        icon: UserCheck,
        variant: "outline" as const
      },
      {
        label: "Remove",
        onClick: () => handleDeleteClick(student, 'remove'),
        icon: User,
        variant: "outline" as const
      },
      {
        label: "Delete",
        onClick: () => handleDeleteClick(student, 'delete'),
        icon: Trash2,
        variant: "outline" as const
      }
    ];

    return (
      <MobileTable
        columns={columns}
        data={students}
        actions={getActions}
        keyField="id"
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Enrollment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  {student.name}
                </div>
              </TableCell>
              <TableCell>
                {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {student.status || 'N/A'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProgress(student.id)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 border-amber-200"
                    onClick={() => handleDeleteClick(student, 'remove')}
                    title="Remove from your students"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    onClick={() => handleDeleteClick(student, 'delete')}
                    title="Delete student from database"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
