import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserPlus, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "../students/AddStudentDialog";

interface StudentSearchProps {
  teacherId?: string;
}

export const StudentSearch = ({ teacherId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  // Fetch all students
  const { data: students, isLoading } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("id, name")
          .eq("status", "active")
          .order("name", { ascending: true });
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching students:", error);
        return [];
      }
    },
  });
  
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const handleStudentClick = (studentId: string) => {
    navigate(`/teacher-portal?tab=progress-book&studentId=${studentId}`);
  };
  
  return (
    <Card className="h-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Student
          </CardTitle>
          {teacherId && (
            <AddStudentDialog teacherId={teacherId} />
          )}
        </div>
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
                {searchQuery 
                  ? "No matching students found" 
                  : "No students available"}
              </div>
            ) : (
              filteredStudents.map((student) => (
                <Button
                  key={student.id}
                  variant="ghost"
                  className="w-full justify-start text-foreground"
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
