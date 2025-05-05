
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DhorBook } from "@/components/dhor-book/DhorBook";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus } from "lucide-react";

interface TeacherDhorBookProps {
  teacherId: string;
}

export const TeacherDhorBook = ({ teacherId }: TeacherDhorBookProps) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("entries");

  // Fetch students assigned to this teacher
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['teacher-students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students_teachers')
        .select('id, student_name')
        .eq('teacher_id', teacherId)
        .eq('active', true)
        .order('student_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }
      
      return data;
    }
  });

  // Reset active tab when student changes
  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab("entries");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dhor Book</h2>
        <p className="text-muted-foreground">Record and track student progress using the Dhor Book system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
          <CardDescription>Choose a student to view or update their Dhor Book</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/2">
              <Select
                disabled={isLoadingStudents}
                onValueChange={handleStudentChange}
                value={selectedStudentId || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStudents ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    students?.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.student_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStudentId && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="entries">Dhor Book Entries</TabsTrigger>
            <TabsTrigger value="summary">Progress Summary</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="entries" className="mt-4">
            <DhorBook studentId={selectedStudentId} teacherId={teacherId} />
          </TabsContent>
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Summary</CardTitle>
                <CardDescription>Overview of student's progress</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Progress summary will be shown here based on Dhor Book entries.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Analytics</CardTitle>
                <CardDescription>Detailed analysis of student's performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Progress analytics will be shown here based on Dhor Book entries.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
