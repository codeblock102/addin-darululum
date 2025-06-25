import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { DhorBook } from "@/components/dhor-book/DhorBook.tsx";
import { ClassroomRecords } from "@/components/dhor-book/ClassroomRecords.tsx";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Loader2,
  Mail,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { StudentSearch } from "@/components/student-progress/StudentSearch.tsx";
import { AttendanceStats } from "@/components/student-progress/AttendanceStats.tsx";
import { StudentPerformanceMetrics } from "@/components/student-progress/StudentPerformanceMetrics.tsx";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useToast } from "@/hooks/use-toast.ts";

interface TeacherDhorBookProps {
  teacherId: string;
}

export const TeacherDhorBook = ({ teacherId }: TeacherDhorBookProps) => {
  const location = useLocation();
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("entries");
  const [viewMode, setViewMode] = useState<"daily" | "classroom">("daily");
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const isMobile = useIsMobile();

  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ["teacherData", teacherId],
    queryFn: async () => {
      if (!teacherId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", teacherId)
        .single();
      if (error) {
        console.error("Error fetching teacher data:", error);
        throw error;
      }
      return data;
    },
    enabled: !!teacherId,
  });

  // Set up realtime updates for the records
  useRealtimeLeaderboard(teacherId, () => {
    console.log(
      "Realtime update detected, refreshing classroom/student records",
    );
  });

  // Check URL for studentId parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const studentId = searchParams.get("studentId");
    if (studentId) {
      setSelectedStudentId(studentId);
    }
  }, [location.search]);

  // Verify student exists and belongs to teacher's classroom
  const { data: studentVerification, isLoading: studentVerifyLoading } =
    useQuery({
      queryKey: ["verify-student-for-teacher", selectedStudentId, teacherId],
      queryFn: async () => {
        if (!selectedStudentId || !teacherData) return null;

        const { data, error } = await supabase
          .from("students")
          .select("id, name")
          .eq("id", selectedStudentId)
          .eq("madrassah_id", teacherData.madrassah_id)
          .eq("section", teacherData.section)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            // PGRST116 is "exact one row not found", which is expected
            console.error("Error verifying student:", error);
          }
          return null;
        }

        return data;
      },
      enabled: !!selectedStudentId && !isLoadingTeacher && !!teacherData,
    });

  // Fetch attendance records for the selected student
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["student-attendance", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId || !studentVerification) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId && !!studentVerification,
  });

  // Handler for student selection
  const handleStudentSelect = (studentId: string, _studentName: string) => {
    setSelectedStudentId(studentId);
    setActiveTab("entries");
    setViewMode("daily"); // Reset to daily view when selecting a student
  };

  const handleSendEmails = async () => {
    setIsSendingEmails(true);
    toast({
      title: "Sending Emails",
      description: "Triggering the daily progress emails. This may take a moment.",
    });
    try {
      const { error } = await supabase.functions.invoke("daily-progress-email");
      if (error) {
        throw error;
      }
      toast({
        title: "Success",
        description: "Successfully triggered the daily progress emails.",
      });
    } catch (error: any) {
      console.error("Failed to invoke daily-progress-email function:", error);
      toast({
        title: "Error Sending Emails",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-16 px-1 sm:px-0">
      <div className="flex justify-between items-center text-center sm:text-left">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
            Dhor Book
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Record and track student progress
          </p>
        </div>
        <Button onClick={handleSendEmails} disabled={isSendingEmails} size="sm">
          {isSendingEmails ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          <span className="hidden sm:inline">Send Daily Emails</span>
        </Button>
      </div>

      {/* View mode tabs - more prominent */}
      <Card className="overflow-hidden">
        <Tabs
          value={viewMode}
          onValueChange={(value) => setViewMode(value as "daily" | "classroom")}
          className="w-full"
        >
          <div className="bg-muted/40 px-2 py-2 sm:px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="daily"
                className="flex items-center gap-1 sm:gap-2 text-xs py-1.5"
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Daily Records</span>
              </TabsTrigger>
              <TabsTrigger
                value="classroom"
                className="flex items-center gap-1 sm:gap-2 text-xs py-1.5"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Classroom</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-2 sm:p-3 md:p-6 overflow-x-hidden">
            {viewMode === "daily" && (
              <>
                <StudentSearch
                  onStudentSelect={handleStudentSelect}
                  selectedStudentId={selectedStudentId}
                  teacherId={teacherId}
                  showHeader={false}
                />

                {studentVerifyLoading && selectedStudentId && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Verifying student...</span>
                  </div>
                )}

                {selectedStudentId && !studentVerifyLoading &&
                  !studentVerification && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 mt-4 border rounded-lg bg-muted/20">
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                    <h3 className="text-base font-medium">Student Not Found</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      The student with ID {selectedStudentId}{" "}
                      could not be found. Please select a different student.
                    </p>
                  </div>
                )}

                {selectedStudentId && studentVerification && (
                  <div className="space-y-4 mt-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold truncate text-foreground">
                        {studentVerification.name}'s Progress
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Calendar className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          {!isMobile ? "Schedule Revision" : "Schedule"}
                        </Button>
                        <Button size="sm" className="text-xs">
                          <Plus className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          {!isMobile ? "New Entry" : "New"}
                        </Button>
                      </div>
                    </div>

                    {/* Performance metrics at the top */}
                    <StudentPerformanceMetrics studentId={selectedStudentId} />

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <div className="overflow-x-auto -mx-2 px-2">
                        <TabsList className="w-full flex-nowrap min-w-max">
                          <TabsTrigger value="entries" className="text-xs">
                            Dhor Book
                          </TabsTrigger>
                          <TabsTrigger value="attendance" className="text-xs">
                            Attendance
                          </TabsTrigger>
                          <TabsTrigger value="summary" className="text-xs">
                            Summary
                          </TabsTrigger>
                          <TabsTrigger value="analytics" className="text-xs">
                            Analytics
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="entries" className="mt-3 sm:mt-4">
                        <DhorBook
                          studentId={selectedStudentId}
                          teacherId={teacherId}
                          isAdmin={false}
                          teacherData={teacherData}
                          isLoadingTeacher={isLoadingTeacher}
                        />
                      </TabsContent>

                      <TabsContent value="attendance" className="mt-3 sm:mt-4">
                        <Card>
                          <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-sm sm:text-base">
                              Attendance Records
                            </CardTitle>
                            <CardDescription className="text-xs">
                              View and track attendance for{" "}
                              {studentVerification.name}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                            {attendanceLoading
                              ? (
                                <div className="flex justify-center py-6 sm:py-8">
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                              )
                              : attendanceData && attendanceData.length > 0
                              ? (
                                <AttendanceStats
                                  attendanceData={attendanceData}
                                />
                              )
                              : (
                                <div className="text-center py-6 sm:py-8">
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    No attendance records found for this
                                    student.
                                  </p>
                                  <Button
                                    className="mt-3 sm:mt-4"
                                    variant="outline"
                                    size="sm"
                                  >
                                    Record Attendance
                                  </Button>
                                </div>
                              )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="summary" className="mt-3 sm:mt-4">
                        <Card>
                          <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-sm sm:text-base">
                              Progress Summary
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Overview of student's progress
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Progress summary will be shown here based on Dhor
                              Book entries.
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="analytics" className="mt-3 sm:mt-4">
                        <Card>
                          <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-sm sm:text-base">
                              Progress Analytics
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Detailed analysis of student's performance
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Progress analytics will be shown here based on
                              Dhor Book entries.
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {!selectedStudentId && (
                  <Card className="p-4 sm:p-6 md:p-12 text-center border-dashed bg-muted/40 mt-3">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted/60 flex items-center justify-center">
                        <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/60" />
                      </div>
                      <h3 className="text-base sm:text-lg font-medium">
                        Select a Student
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                        Please search and select a student above to view their
                        Dhor Book entries, attendance records, and progress
                        analytics.
                      </p>
                    </div>
                  </Card>
                )}
              </>
            )}

            {viewMode === "classroom" && (
              <ClassroomRecords teacherId={teacherId} isAdmin={false} />
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};
