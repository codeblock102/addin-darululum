
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
import { Loader2, Search, User, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "./students/AddStudentDialog";

interface MyStudentsProps {
  teacherId: string;
}

export const MyStudents = ({ teacherId }: MyStudentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // First fetch teacher's assigned students
  const { data: assignedStudents, isLoading: loadingAssignments } = useQuery({
    queryKey: ['teacher-student-assignments', teacherId],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("students_teachers")
        .select("student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);
        
      if (error) {
        console.error('Error fetching student assignments:', error);
        return [];
      }
      
      return assignments || [];
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
      
      return data || [];
    },
    enabled: !!assignedStudents && assignedStudents.length > 0,
  });
  
  const isLoading = loadingAssignments || loadingStudents;
  
  // Filter students based on search query
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click on "View Progress" button
  const handleViewProgress = (studentId: string) => {
    navigate(`/teacher-portal?tab=dhor-book&studentId=${studentId}`);
  };
  
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
      <CardContent className="p-0 md:p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredStudents && filteredStudents.length > 0 ? (
              isMobile ? (
                <div className="grid gap-2 px-4 pb-4">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="border rounded-lg p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="font-medium">{student.name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status || 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Enrolled: {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => handleViewProgress(student.id)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        View Progress
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
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
                      {filteredStudents.map((student) => (
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
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {student.status || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewProgress(student.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              View Progress
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
    </Card>
  );
};
