
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { useStudentsData } from "./grading/useStudentsData";
import { useStudentGrades } from "./grading/useStudentGrades";
import { useGradeSubmit } from "./grading/useGradeSubmit";
import { StudentGradeData } from "./grading/types";
import { StudentsOverview } from "./grading/StudentsOverview";
import { StudentSelector } from "./grading/StudentSelector";
import { GradeForm } from "./grading/GradeForm";
import { PreviousGrades } from "./grading/PreviousGrades";

interface GradingProps {
  teacherId: string;
}

export const TeacherGrading = ({ teacherId }: GradingProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [gradeData, setGradeData] = useState<StudentGradeData>({
    memorization_quality: "average",
    tajweed_grade: "",
    attendance_grade: "",
    participation_grade: "",
    notes: ""
  });
  
  // Fetch students data
  const { data: students, isLoading: studentsLoading } = useStudentsData();
  
  // Fetch student grades
  const { data: studentGrades, isLoading: gradesLoading } = useStudentGrades(selectedStudent, students);
  
  // Fetch teacher data
  const { data: teacherData } = useQuery({
    queryKey: ['teacher-details-for-grading', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('id', teacherId)
        .single();
      
      if (error) {
        console.error('Error fetching teacher details:', error);
        return null;
      }
      
      return data;
    }
  });
  
  // Grade submission mutation
  const submitGradeMutation = useGradeSubmit(teacherId, selectedStudent, students, teacherData);
  
  // Event handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGradeData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setGradeData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmitGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Please select a student.",
        variant: "destructive",
      });
      return;
    }
    
    submitGradeMutation.mutate(gradeData);
  };
  
  const handleSelectStudent = (name: string) => {
    setSelectedStudent(name);
    setActiveTab("new-grade");
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Student Grading System
          </CardTitle>
          <CardDescription>
            Evaluate and track student performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="students">Student Grades</TabsTrigger>
              <TabsTrigger value="new-grade">New Grade</TabsTrigger>
            </TabsList>
            
            <TabsContent value="students">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Student Performance Overview</h3>
                </div>
                
                <StudentsOverview 
                  students={students || []} 
                  isLoading={studentsLoading}
                  onSelectStudent={handleSelectStudent}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="new-grade">
              <div className="space-y-4">
                <StudentSelector
                  selectedStudent={selectedStudent}
                  onSelectStudent={setSelectedStudent}
                  students={students || []}
                  isLoading={studentsLoading}
                />
                
                {selectedStudent && (
                  <GradeForm
                    selectedStudent={selectedStudent}
                    onSubmit={handleSubmitGrade}
                    isSubmitting={submitGradeMutation.isPending}
                    gradeData={gradeData}
                    onInputChange={handleInputChange}
                    onSelectChange={handleSelectChange}
                  />
                )}
                
                <PreviousGrades
                  selectedStudent={selectedStudent}
                  grades={studentGrades || []}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
