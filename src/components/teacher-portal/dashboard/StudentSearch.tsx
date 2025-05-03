
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserRound } from "lucide-react";

interface StudentSearchProps {
  teacherId?: string;
}

export const StudentSearch = ({ teacherId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: students, isLoading } = useQuery({
    queryKey: ["teacher-students", teacherId],
    queryFn: async () => {
      if (!teacherId) return [];
      
      const { data, error } = await supabase
        .from("students_teachers")
        .select("student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [
          { student_name: "Ahmad Hassan" },
          { student_name: "Fatima Ahmed" },
          { student_name: "Mohammed Ali" },
          { student_name: "Sara Mahmoud" },
        ];
      }
      
      return data;
    },
    enabled: !!teacherId,
  });
  
  const filteredStudents = students?.filter(student => 
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
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
                No students found
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <UserRound className="h-4 w-4 mr-2 opacity-70" />
                  {student.student_name}
                </Button>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
