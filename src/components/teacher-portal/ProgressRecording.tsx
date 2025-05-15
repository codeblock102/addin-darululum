
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressForm } from "./progress/ProgressForm";
import { useTeacherData } from "./progress/useTeacherData";
import { useStudentsData } from "./progress/useStudentsData";
import { ProgressRecordingProps } from "./progress/types";

export const ProgressRecording = ({ teacherId }: ProgressRecordingProps) => {
  // Fetch teacher details for contributor info
  const { data: teacherData } = useTeacherData(teacherId);

  // Fetch all students from shared database
  const { data: students, isLoading: studentsLoading } = useStudentsData();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Student Sabaq Progress</CardTitle>
        <CardDescription>
          Document a student's Quran memorization progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProgressForm 
          teacherId={teacherId}
          teacherData={teacherData}
          students={students || []}
          studentsLoading={studentsLoading}
        />
      </CardContent>
    </Card>
  );
};
