
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, User, UserCheck } from "lucide-react";

interface MyStudentsProps {
  teacherId: string;
}

export const MyStudents = ({ teacherId }: MyStudentsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch students assigned to this teacher
  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      const { data: assignedStudents, error: assignmentError } = await supabase
        .from('students_teachers')
        .select('student_name, id, assigned_date')
        .eq('teacher_id', teacherId)
        .eq('active', true);
      
      if (assignmentError) {
        console.error('Error fetching assigned students:', assignmentError);
        return [];
      }
      
      return assignedStudents;
    }
  });
  
  // Filter students based on search query
  const filteredStudents = students?.filter(student => 
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">My Students</CardTitle>
        <CardDescription>
          Students assigned to you for instruction and mentoring
        </CardDescription>
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
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {filteredStudents && filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Assigned Since</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          {student.student_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(student.assigned_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <UserCheck className="h-4 w-4 mr-2" />
                          View Progress
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery 
                  ? "No students found matching your search." 
                  : "No students are currently assigned to you."}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
