
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserRound } from "lucide-react";
import { StudentQuickProfileModal } from "./StudentQuickProfileModal";

interface StudentSearchProps {
  teacherId: string;
}

export const StudentSearch = ({ teacherId }: StudentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      return data;
    }
  });
  
  useEffect(() => {
    if (students && searchQuery) {
      const filtered = students.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.guardian_name && student.guardian_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStudents(filtered.slice(0, 5)); // Limit to 5 results
    } else {
      setFilteredStudents([]);
    }
  }, [searchQuery, students]);
  
  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };
  
  return (
    <>
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Student
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search students by name or guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg border-2 focus:border-purple-400"
            />
          </div>
          
          {filteredStudents.length > 0 && (
            <div className="mt-4 border rounded-md overflow-hidden">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="p-3 border-b last:border-0 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                      <UserRound className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.guardian_name || 'No guardian information'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${student.id}`)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && filteredStudents.length === 0 && !isLoading && (
            <div className="mt-4 text-center p-4 border rounded-md bg-muted/30">
              <p className="text-muted-foreground">No students found matching "{searchQuery}"</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedStudent && (
        <StudentQuickProfileModal
          student={selectedStudent}
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
        />
      )}
    </>
  );
};
