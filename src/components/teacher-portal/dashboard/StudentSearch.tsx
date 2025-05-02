
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserRound, Loader2 } from "lucide-react";
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
      <Card className="col-span-1 md:col-span-2 border border-purple-100 dark:border-purple-900/30 shadow-sm">
        <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Student
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 dark:text-purple-300">
              <Search className="h-5 w-5" />
            </div>
            <Input
              placeholder="Search students by name or guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg h-auto border-2 border-purple-100 dark:border-purple-900/30 focus:border-purple-400 dark:focus:border-purple-500 rounded-xl transition-colors"
            />
          </div>
          
          {isLoading && searchQuery && (
            <div className="mt-4 flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}
          
          {filteredStudents.length > 0 && (
            <div className="mt-4 border rounded-md overflow-hidden shadow-sm border-purple-100 dark:border-purple-900/30">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className="p-3 border-b last:border-0 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors"
                  onClick={() => handleStudentClick(student)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                      <UserRound className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.guardian_name || 'No guardian information'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/students/${student.id}`);
                    }}
                    className="border-purple-200 dark:border-purple-700 hover:bg-purple-100"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && filteredStudents.length === 0 && !isLoading && (
            <div className="mt-4 text-center p-6 border rounded-md bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
              <p className="text-muted-foreground">No students found matching "{searchQuery}"</p>
            </div>
          )}
          
          {!searchQuery && (
            <div className="mt-6 flex justify-center">
              <div className="text-center text-muted-foreground px-4 py-8 max-w-md">
                <UserRound className="h-10 w-10 mx-auto mb-3 text-purple-300 dark:text-purple-500" />
                <h3 className="text-lg font-medium mb-2 text-purple-700 dark:text-purple-300">Find Your Students</h3>
                <p>Search by student name or guardian to access their profiles, Dhor Book, and progress records.</p>
              </div>
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
