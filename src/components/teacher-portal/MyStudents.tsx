
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, UserPlus, UserCheck } from "lucide-react";
import { StudentDialog } from "@/components/students/StudentDialog";
import { StudentList } from "@/components/students/StudentList";

interface MyStudentsProps {
  teacherId: string;
}

export const MyStudents = ({ teacherId }: MyStudentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const queryClient = useQueryClient();
  
  // Function to handle opening the dialog for adding a new student
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsDialogOpen(true);
  };
  
  // Function to handle editing an existing student
  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };
  
  // Function to handle closing the dialog
  const handleCloseDialog = () => {
    setSelectedStudent(null);
    setIsDialogOpen(false);
  };
  
  // Function to handle assigning a student to this teacher after creation/edit
  const handleStudentAssignment = async (studentId: string, studentName: string) => {
    try {
      // First check if this student is already assigned to this teacher
      const { data: existingAssignment } = await supabase
        .from('students_teachers')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('student_name', studentName)
        .eq('active', true)
        .single();
      
      // If no existing assignment, create one
      if (!existingAssignment) {
        const { error } = await supabase
          .from('students_teachers')
          .insert({
            teacher_id: teacherId,
            student_name: studentName,
            active: true,
            assigned_date: new Date().toISOString()
          });
        
        if (error) throw error;
        
        // Invalidate the students query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['students', teacherId] });
      }
    } catch (error) {
      console.error('Error assigning student to teacher:', error);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl">My Students</CardTitle>
            <CardDescription>
              Manage your assigned students
            </CardDescription>
          </div>
          <Button onClick={handleAddStudent} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <StudentList 
          searchQuery={searchQuery} 
          onEdit={handleEditStudent}
          teacherId={teacherId}
        />
      </CardContent>
      
      {/* Dialog for adding/editing students */}
      <StudentDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        selectedStudent={selectedStudent} 
        onClose={handleCloseDialog}
        onSuccess={(student) => {
          // When a student is successfully added or updated, assign them to this teacher
          if (student && student.id && student.name) {
            handleStudentAssignment(student.id, student.name);
          }
        }}
      />
    </Card>
  );
};
