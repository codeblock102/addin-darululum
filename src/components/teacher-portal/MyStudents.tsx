
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Search, Trash2, User, UserCheck, UserPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "./students/AddStudentDialog";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission } from "@/utils/roleUtils";

interface MyStudentsProps {
  teacherId: string;
}

interface Student {
  id: string;
  name: string;
  enrollment_date: string | null;
  status: 'active' | 'inactive';
}

interface StudentAssignment {
  id: string;
  student_name: string;
}

export const MyStudents = ({ teacherId }: MyStudentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string, studentId: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteType, setIsDeleteType] = useState<'remove' | 'delete'>('remove');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
  
  const removeStudentMutation = useMutation({
    mutationFn: async ({ assignmentId }: { assignmentId: string }) => {
      const { error } = await supabase
        .from('students_teachers')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      return assignmentId;
    },
    onSuccess: () => {
      toast({
        title: "Student removed",
        description: `${studentToDelete?.name} has been removed from your students.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['teacher-student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students-details'] });
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove student: ${error.message}`,
        variant: "destructive"
      });
    },
  });
  
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      // First, remove any student-teacher relationships
      const { error: relationshipError } = await supabase
        .from('students_teachers')
        .delete()
        .eq('student_name', studentToDelete?.name || '');
      
      if (relationshipError) throw relationshipError;
      
      // Then delete the student
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);
      
      if (error) throw error;
      return studentId;
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: `${studentToDelete?.name} has been permanently deleted from the database.`,
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-student-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students-details'] });
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive"
      });
    },
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
  
  // Handle click on delete button
  const handleDeleteClick = (student: Student, deleteType: 'remove' | 'delete') => {
    const assignment = assignedStudents?.find(a => a.student_name === student.name);
    if (assignment) {
      setStudentToDelete({ id: assignment.id, name: student.name, studentId: student.id });
      setIsDeleteType(deleteType);
      setIsDeleteDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Could not find the student assignment data.",
        variant: "destructive"
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (studentToDelete) {
      if (isDeleteType === 'delete') {
        deleteStudentMutation.mutate(studentToDelete.studentId);
      } else {
        removeStudentMutation.mutate({ assignmentId: studentToDelete.id });
      }
    }
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status || 'N/A'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Enrolled: {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'N/A'}
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
                            onClick={() => handleDeleteClick(student, 'remove')}
                            title="Remove from your students"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(student, 'delete')}
                            title="Delete student from database"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isDeleteType === 'delete' ? 'Delete Student' : 'Remove Student'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isDeleteType === 'delete' ? (
                <>
                  Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone and will permanently remove the student from the database.
                </>
              ) : (
                <>
                  Are you sure you want to remove {studentToDelete?.name} from your students? This will only remove the assignment, not delete the student from the system.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteStudentMutation.isPending || removeStudentMutation.isPending ? 
                (isDeleteType === 'delete' ? "Deleting..." : "Removing...") : 
                (isDeleteType === 'delete' ? "Delete" : "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
