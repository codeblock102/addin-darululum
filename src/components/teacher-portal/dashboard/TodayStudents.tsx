
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, UserRound, CalendarX, BookOpen } from "lucide-react";
import { StudentQuickProfileModal } from "./StudentQuickProfileModal";
import { useState } from "react";

interface TodayStudentsProps {
  teacherId: string;
}

export const TodayStudents = ({ teacherId }: TodayStudentsProps) => {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  const { data: todayStudents, isLoading } = useQuery({
    queryKey: ['today-students', teacherId, today],
    queryFn: async () => {
      // Fetch classes scheduled for today
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, name, days_of_week')
        .eq('teacher_id', teacherId)
        .contains('days_of_week', [today]);
        
      if (classError) {
        console.error('Error fetching today\'s classes:', classError);
        return [];
      }
      
      if (!classes || classes.length === 0) return [];
      
      // Get all class IDs for today
      const classIds = classes.map(c => c.id);
      
      // Fetch students enrolled in these classes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select(`
          student_id,
          students(*)
        `)
        .in('class_id', classIds)
        .eq('status', 'active');
        
      if (enrollmentError) {
        console.error('Error fetching student enrollments:', enrollmentError);
        return [];
      }
      
      // Extract unique students
      const studentsMap = new Map();
      enrollments?.forEach(enrollment => {
        if (enrollment.students) {
          studentsMap.set(enrollment.students.id, enrollment.students);
        }
      });
      
      return Array.from(studentsMap.values());
    }
  });
  
  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!todayStudents || todayStudents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <CalendarX className="h-10 w-10 mb-2 text-muted-foreground" />
          <p>No students scheduled for today</p>
        </div>
      );
    }
    
    return (
      <div className="divide-y">
        {todayStudents.map((student: any) => (
          <div 
            key={student.id}
            className="flex items-center justify-between py-3 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 cursor-pointer transition-colors px-1 rounded-md"
            onClick={() => handleStudentClick(student)}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <UserRound className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">{student.name}</p>
                {student.guardian_contact && (
                  <p className="text-xs text-muted-foreground">📞 {student.guardian_contact}</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm flex items-center gap-1 text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/students/${student.id}?tab=dhor-book`);
              }}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Dhor Book</span>
            </Button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Card className="border border-blue-100 dark:border-blue-900/30 shadow-sm">
        <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
          <CardTitle className="flex items-center justify-between text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Today's Students
            </div>
            <div className="text-sm font-normal text-blue-600/80 dark:text-blue-400/80">{today}</div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {renderContent()}
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
