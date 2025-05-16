
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
  
  // First fetch teacher's assigned students
  const { data: assignedStudents, isLoading: loadingAssignments } = useQuery({
    queryKey: ['teacher-student-assignments', teacherId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("students_teachers")
        .select("id, student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);
        
      if (error) {
        console.error('Error fetching student assignments:', error);
        return [];
      }
      
      return assignments as StudentAssignment[] || [];
    },
    enabled: !!teacherId
  });
  
  // Then fetch details for those students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['teacher-students-details', assignedStudents],
    queryFn: async () => {
      if (!assignedStudents || assignedStudents.length === 0) {
        return [];
      }
      
      const studentNames = assignedStudents.map(assignment => assignment.student_name);
      
      const { data, error } = await supabase
        .from('students')
        .select('id, name, enrollment_date, status')
        .in('name', studentNames);
      
      if (error) {
        console.error('Error fetching student details:', error);
        return [];
      }
      
      return data as Student[] || [];
    },
    enabled: !!assignedStudents && assignedStudents.length > 0,
  });
  
  const isLoading = loadingAssignments || loadingStudents;
  
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
              Students assigned to you
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
                  : assignedStudents && assignedStudents.length > 0
                    ? "No student details available for your assignments."
                    : "No students are currently assigned to you. Use the 'Add Student' button above to get started."}
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
