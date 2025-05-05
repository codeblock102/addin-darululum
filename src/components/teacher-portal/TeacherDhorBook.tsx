
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DhorBook } from "@/components/dhor-book/DhorBook";
import { Loader2, Plus, Calendar, Search } from "lucide-react";
import { StudentSearch } from "@/components/student-progress/StudentSearch";
import { AttendanceStats } from "@/components/student-progress/AttendanceStats";
import { StudentPerformanceMetrics } from "@/components/student-progress/StudentPerformanceMetrics";

interface TeacherDhorBookProps {
  teacherId: string;
}

export const TeacherDhorBook = ({ teacherId }: TeacherDhorBookProps) => {
  const location = useLocation();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [activeTab, setActiveTab] = useState("entries");

  // Check URL for studentId parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const studentId = searchParams.get('studentId');
    if (studentId) {
      setSelectedStudentId(studentId);
      // Get student name from database
      const fetchStudentName = async () => {
        const { data } = await supabase
          .from('students')
          .select('name')
          .eq('id', studentId)
          .single();
          
        if (data) {
          setSelectedStudentName(data.name);
        }
      };
      fetchStudentName();
    }
  }, [location.search]);

  // Fetch attendance records for the selected student
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudentId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  // Handler for student selection
  const handleStudentSelect = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
    setActiveTab("entries");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dhor Book</h2>
        <p className="text-muted-foreground">Record and track student progress using the Dhor Book system</p>
      </div>

      <StudentSearch
        onStudentSelect={handleStudentSelect}
        selectedStudentId={selectedStudentId}
        teacherId={teacherId}
        showHeader={false}
      />

      {selectedStudentId && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{selectedStudentName}'s Progress</h3>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Revision
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Entry
              </Button>
            </div>
          </div>
          
          {/* Performance metrics at the top */}
          <StudentPerformanceMetrics studentId={selectedStudentId} />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="entries">Dhor Book Entries</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="summary">Progress Summary</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="entries" className="mt-4">
              <DhorBook studentId={selectedStudentId} teacherId={teacherId} />
            </TabsContent>
            
            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>View and track attendance for {selectedStudentName}</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : attendanceData && attendanceData.length > 0 ? (
                    <AttendanceStats attendanceData={attendanceData} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No attendance records found for this student.</p>
                      <Button className="mt-4" variant="outline">Record Attendance</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
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
        </div>
      )}

      {!selectedStudentId && (
        <Card className="p-12 text-center border-dashed bg-muted/40">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-muted/60 flex items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-medium">Select a Student</h3>
            <p className="text-muted-foreground max-w-md">
              Please search and select a student above to view their Dhor Book entries, attendance records, and progress analytics.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
