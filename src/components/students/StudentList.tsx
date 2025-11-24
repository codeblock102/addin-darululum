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
import { Edit, Users, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: "active" | "inactive" | "vacation" | "hospitalized" | "suspended" | "graduated";
  madrassah_id?: string;
  section?: string;
  medical_condition?: string | null;
  status_start_date?: string | null;
  status_end_date?: string | null;
}

interface StudentListProps {
  students?: Student[];
  isLoading?: boolean;
  onEditStudent?: (student: Student) => void;
}

const getStatusColorClass = (status: string) => {
  switch (status) {
    case "active": return "bg-green-100 text-green-800 hover:bg-green-200";
    case "inactive": return "bg-red-100 text-red-800 hover:bg-red-200";
    case "suspended": return "bg-red-100 text-red-800 hover:bg-red-200";
    case "hospitalized": return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case "vacation": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "graduated": return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default: return "";
  }
};

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
            <TableHead>Section</TableHead>
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
                <Badge variant="secondary" className="capitalize">
                  {student.section || "Unassigned"}
                </Badge>
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
                <div className="flex flex-col items-start gap-1">
                  <Badge
                    variant="outline"
                    className={`capitalize ${getStatusColorClass(student.status)}`}
                  >
                    {student.status}
                  </Badge>
                  {(student.status === "vacation" || student.status === "hospitalized" || student.status === "suspended") && student.status_start_date && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(student.status_start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {student.status_end_date ? ` - ${new Date(student.status_end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ' - Ongoing'}
                      </span>
                    </div>
                  )}
                </div>
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
