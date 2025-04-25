
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StudentAssignment {
  id: string;
  studentId?: string;
  name: string;
  active: boolean;
  assignedDate?: string;
  guardianName?: string;
  guardianContact?: string;
}

interface TeacherStudentsTabProps {
  teacherId: string;
}

export function TeacherStudentsTab({ teacherId }: TeacherStudentsTabProps) {
  // Fetch students for this teacher
  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students_teachers')
        .select(`
          id,
          student_name,
          active,
          assigned_date
        `)
        .eq('teacher_id', teacherId)
        .order('assigned_date', { ascending: false });
        
      if (error) throw error;
      
      // Format the data for display
      return data.map(item => ({
        id: item.id,
        name: item.student_name || 'Unknown',
        active: item.active,
        assignedDate: item.assigned_date,
        // These fields would come from a proper join in a real implementation
        guardianName: "—",
        guardianContact: "—",
      })) as StudentAssignment[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-3" />
        <h3 className="text-lg font-medium">No Students Assigned</h3>
        <p className="text-muted-foreground mt-2 mb-6">
          This teacher doesn't have any students assigned yet.
        </p>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Assign New Student
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Students ({students.length})</h3>
        <Button size="sm">
          <UserPlus className="mr-1 h-4 w-4" />
          Assign Student
        </Button>
      </div>
      
      <Card className="overflow-hidden border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  {student.active ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell>{student.guardianName || "—"}</TableCell>
                <TableCell>{student.guardianContact || "—"}</TableCell>
                <TableCell>
                  {student.assignedDate ? 
                    formatDistanceToNow(new Date(student.assignedDate), { addSuffix: true }) :
                    "—"
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
