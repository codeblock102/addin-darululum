
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, UserRound, CalendarX } from "lucide-react";
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
            className="flex items-center justify-between py-3 hover:bg-muted/10 cursor-pointer transition-colors px-1"
            onClick={() => handleStudentClick(student)}
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <UserRound className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="font-medium">{student.name}</p>
                {student.guardian_contact && (
                  <p className="text-xs text-muted-foreground">📞 {student.guardian_contact}</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/students/${student.id}?tab=dhor-book`);
              }}
            >
              Dhor Book
            </Button>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>Today's Students</div>
            <div className="text-sm font-normal text-muted-foreground">{today}</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
