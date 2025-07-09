import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Edit, User, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive";
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
}

interface StudentListProps {
  students?: Student[];
  isLoading?: boolean;
  onEditStudent?: (student: Student) => void;
}

export const StudentList = ({
  students,
  isLoading,
  onEditStudent,
}: StudentListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-gray-500">
        <Users className="h-16 w-16 mb-4" />
        <h3 className="text-xl font-semibold">No Students Found</h3>
        <p>There are no students to display at the moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/30 border-b">
        💡 Click on any student row or use the Edit button to view and edit student details
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Student</TableHead>
            <TableHead>Guardian</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrollment Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow 
              key={student.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onEditStudent?.(student)}
            >
              <TableCell>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{student.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p>{student.guardian_name || "N/A"}</p>
                  <p className="text-xs text-gray-500">
                    {student.guardian_contact || "No contact"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={student.status === "active" ? "default" : "destructive"}
                >
                  {student.status}
                </Badge>
              </TableCell>
              <TableCell>
                {student.enrollment_date
                  ? new Date(student.enrollment_date).toLocaleDateString()
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click when clicking the button
                    onEditStudent?.(student);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
