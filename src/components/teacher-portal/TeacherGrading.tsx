import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { GradeData, GradingProps } from "./grading/types";
import { useGradingData, useStudentGrades } from "./grading/useGradingData";
import { StudentsOverviewTable } from "./grading/StudentsOverviewTable";
import { GradeForm } from "./grading/GradeForm";
import { PreviousGradesTable } from "./grading/PreviousGradesTable";

export const TeacherGrading = ({ teacherId }: GradingProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("students");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [gradeData, setGradeData] = useState<GradeData>({
    memorization_quality: "average",
    notes: "",
  });

  const { students, studentsLoading, submitGradeMutation } = useGradingData(
    teacherId,
  );
  const { data: studentGrades } = useStudentGrades(selectedStudent, students);

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

    submitGradeMutation.mutate(
      { gradeData, selectedStudent },
      {
        onSuccess: () => {
          setGradeData({
            memorization_quality: "average",
            notes: "",
          });
        },
      },
    );
  };

  const handleGradeStudent = (studentName: string) => {
    setSelectedStudent(studentName);
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
                  <h3 className="text-lg font-medium">
                    Student Performance Overview
                  </h3>
                </div>

                <StudentsOverviewTable
                  students={students}
                  studentsLoading={studentsLoading}
                  onGradeStudent={handleGradeStudent}
                />
              </div>
            </TabsContent>

            <TabsContent value="new-grade">
              <div className="space-y-4">
                <GradeForm
                  students={students}
                  studentsLoading={studentsLoading}
                  selectedStudent={selectedStudent}
                  onStudentChange={setSelectedStudent}
                  gradeData={gradeData}
                  onGradeDataChange={setGradeData}
                  onSubmit={handleSubmitGrade}
                  isSubmitting={submitGradeMutation.isPending}
                />

                <PreviousGradesTable
                  selectedStudent={selectedStudent}
                  studentGrades={studentGrades}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
