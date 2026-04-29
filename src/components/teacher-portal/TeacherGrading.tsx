import { useState } from "react";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { GraduationCap } from "lucide-react";
import { GradeData, GradingProps } from "./grading/types.ts";
import { useGradingData, useStudentGrades } from "./grading/useGradingData.ts";
import { StudentsOverviewTable } from "./grading/StudentsOverviewTable.tsx";
import { GradeForm } from "./grading/GradeForm.tsx";
import { PreviousGradesTable } from "./grading/PreviousGradesTable.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

export const TeacherGrading = ({ teacherId }: GradingProps) => {
  const { toast } = useToast();
  const { t } = useI18n();
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
        title: t("common.error"),
        description: t("pages.teacherPortal.grading.selectStudent", "Please select a student."),
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
            {t("pages.teacherPortal.grading.title", "Student Grading System")}
          </CardTitle>
          <CardDescription>
            {t("pages.teacherPortal.grading.subtitle", "Evaluate and track student performance")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="students">{t("pages.teacherPortal.grading.tabs.students", "Student Grades")}</TabsTrigger>
              <TabsTrigger value="new-grade">{t("pages.teacherPortal.grading.tabs.new", "New Grade")}</TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">{t("pages.teacherPortal.grading.overviewTitle", "Student Performance Overview")}</h3>
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
