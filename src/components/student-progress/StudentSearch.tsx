
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle } from "lucide-react";

interface StudentSearchProps {
  onStudentSelect: (studentId: string, studentName: string) => void;
  selectedStudentId?: string | null;
  teacherId?: string;
  showHeader?: boolean;
  showAllStudents?: boolean; // Add a prop to explicitly show all students
}

export const StudentSearch = ({ 
  onStudentSelect, 
  selectedStudentId, 
  teacherId, 
  showHeader = true,
  showAllStudents = false
}: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch students with optional teacher filter
  const {
    data: students,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students-search", teacherId, showAllStudents],
    queryFn: async () => {
      console.log("Fetching students with teacherId:", teacherId, "showAllStudents:", showAllStudents);
      
      try {
        let query = supabase.from("students").select("id, name").eq("status", "active");
        
        // Only filter by teacher if not showing all students and teacher ID is provided
        if (teacherId && !showAllStudents) {
          // First, check if any students are explicitly assigned to this teacher
          const { data: assignedStudents } = await supabase
            .from("students_teachers")
            .select("student_name")
            .eq("teacher_id", teacherId);
            
          console.log("Teacher assigned students:", assignedStudents?.length || 0);
          
          // If there are specifically assigned students, get them
          if (assignedStudents && assignedStudents.length > 0) {
            // Get student names from assignments
            const studentNames = assignedStudents.map(s => s.student_name);
            if (studentNames.length > 0) {
              query = query.in("name", studentNames);
            }
          }
        }
        
        const { data, error } = await query.order("name");
        
        if (error) {
          console.error("Error fetching students:", error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} students for search component`);
        return data || [];
      } catch (error) {
        console.error("Error in student search query:", error);
        return [];
      }
    },
  });

  // Filter students based on search query
  const filteredStudents = students?.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Card className={`${!showHeader ? 'border-0 shadow-none' : ''}`}>
      {showHeader && (
        <CardHeader>
          <CardTitle>Student Search</CardTitle>
          <CardDescription>
            Find a student to view their progress
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className={!showHeader ? 'p-0' : undefined}>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search students by name..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Loading students...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-4 text-red-500">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Error loading students</span>
              </div>
            ) : filteredStudents && filteredStudents.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {filteredStudents.map((student) => (
                  <Button
                    key={student.id}
                    variant={selectedStudentId === student.id ? "secondary" : "ghost"}
                    className={`w-full justify-start text-left px-3 py-2 h-auto ${selectedStudentId === student.id ? "bg-secondary" : ""}`}
                    onClick={() => onStudentSelect(student.id, student.name)}
                  >
                    {student.name}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? "No students matching your search" : "No students found"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
