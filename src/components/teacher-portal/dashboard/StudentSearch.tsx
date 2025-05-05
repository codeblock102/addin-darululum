
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentSearchProps {
  teacherId?: string;
}

export const StudentSearch = ({ teacherId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  const { data: students, isLoading } = useQuery({
    queryKey: ["teacher-students", teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      try {
        // First get the student names assigned to this teacher
        const { data: assignments, error: assignmentsError } = await supabase
          .from("students_teachers")
          .select("student_name")
          .eq("teacher_id", teacherId)
          .eq("active", true);
          
        if (assignmentsError) throw assignmentsError;
        
        // If no assignments, return empty array
        if (!assignments || assignments.length === 0) {
          return [];
        }
        
        // Get student details using the student names
        const studentNames = assignments.map(assignment => assignment.student_name);
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, name")
          .in("name", studentNames)
          .order("name");
          
        if (studentsError) throw studentsError;
        return studentsData || [];
      } catch (error) {
        console.error("Error fetching students:", error);
        return [];
      }
    },
    enabled: !!teacherId,
  });
  
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const handleStudentClick = (studentId: string) => {
    navigate(`/teacher-portal?tab=dhor-book&studentId=${studentId}`);
  };
  
  return (
    <Card className="h-auto lg:h-[350px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Find Student
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <div className="overflow-y-auto max-h-[180px] space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                {searchQuery ? "No matching students found" : "No students found"}
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleStudentClick(student.id)}
                >
                  <UserRound className="h-4 w-4 mr-2 opacity-70" />
                  {student.name}
                </Button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
