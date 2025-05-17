import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { LoadingSpinner } from "./students/LoadingSpinner";
import { StudentSearchBar } from "./students/StudentSearchBar";
import { StudentTable } from "./students/StudentTable";
import { StudentMobileList } from "./students/StudentMobileList";
import { StudentDeleteDialog } from "./students/StudentDeleteDialog";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface MyStudentsProps {
  teacherId: string;
}

export interface Student {
  id: string;
  name: string;
  enrollment_date: string | null;
  status: 'active' | 'inactive';
}

export interface StudentAssignment {
  id: string;
  student_name: string;
}

export const MyStudents = ({ teacherId }: MyStudentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string, studentId: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteType, setIsDeleteType] = useState<'remove' | 'delete'>('remove');
  const isMobile = useIsMobile();
  
  // Fetch all students instead of just assigned ones
  const { data: students, isLoading } = useQuery({
    queryKey: ['all-students-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, enrollment_date, status')
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      return data as Student[] || [];
    }
  });
  
  // Keep track of assigned students for UI differentiation
  const { data: assignedStudents } = useQuery({
    queryKey: ['teacher-student-assignments', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_teachers")
        .select("id, student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);
        
      if (error) {
        console.error('Error fetching student assignments:', error);
        return [];
      }
      
      return data as StudentAssignment[] || [];
    },
    enabled: !!teacherId
  });
  
  // Filter students based on search query
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Students</CardTitle>
            <CardDescription>
              All active students in the system
            </CardDescription>
          </div>
          <AddStudentDialog teacherId={teacherId} />
        </div>
        <StudentSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {filteredStudents && filteredStudents.length > 0 ? (
              isMobile ? (
                <StudentMobileList 
                  students={filteredStudents} 
                  assignedStudents={assignedStudents}
                  setStudentToDelete={setStudentToDelete}
                  setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  setIsDeleteType={setIsDeleteType}
                />
              ) : (
                <StudentTable 
                  students={filteredStudents} 
                  assignedStudents={assignedStudents}
                  setStudentToDelete={setStudentToDelete}
                  setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                  setIsDeleteType={setIsDeleteType}
                />
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery 
                  ? "No students found matching your search." 
                  : "No active students found in the system."}
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <StudentDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        setIsOpen={setIsDeleteDialogOpen}
        studentToDelete={studentToDelete}
        isDeleteType={isDeleteType}
        teacherId={teacherId}
      />
    </Card>
  );
};
