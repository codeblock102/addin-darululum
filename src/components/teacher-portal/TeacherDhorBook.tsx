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
import { Badge } from "@/components/ui/badge.tsx";
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
  TrendingUp,
  Target,
  CheckCircle,
  Award,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { StudentSearch } from "@/components/student-progress/StudentSearch.tsx";
import { AttendanceStats } from "@/components/student-progress/AttendanceStats.tsx";
import { StudentPerformanceMetrics } from "@/components/student-progress/StudentPerformanceMetrics.tsx";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard.ts";
import { useIsMobile } from "@/hooks/use-mobile.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog.tsx";

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
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState(false);
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

  // Fetch progress entries for detailed analysis
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["student-progress-analysis", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId || !studentVerification) return [];

      const startDate = subMonths(new Date(), 6); // Last 6 months
      
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("student_id", selectedStudentId)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching progress data:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!selectedStudentId && !!studentVerification,
  });

  // Progress analysis logic
  const getQualityScore = (quality: string): number => {
    const qualityMap: Record<string, number> = {
      excellent: 5,
      good: 4,
      average: 3,
      needsWork: 2,
      poor: 2,
      horrible: 1,
    };
    return qualityMap[quality] || 0;
  };

  const generateProgressAnalysis = () => {
    if (!progressData || progressData.length === 0) return null;

    const now = new Date();
    const thirtyDaysAgo = subMonths(now, 1);
    const recentEntries = progressData.filter(entry => 
      parseISO(entry.date) >= thirtyDaysAgo
    );

    const totalPages = progressData.reduce((sum, entry) => sum + (entry.pages_memorized || 0), 0);
    const totalRevisions = progressData.reduce((sum, entry) => sum + (entry.verses_memorized || 0), 0); // Use verses_memorized as proxy for revisions
    const averageQuality = progressData.length > 0 
      ? progressData.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality || 'average'), 0) / progressData.length
      : 0;

    const recentPages = recentEntries.reduce((sum, entry) => sum + (entry.pages_memorized || 0), 0);
    const recentQuality = recentEntries.length > 0
      ? recentEntries.reduce((sum, entry) => sum + getQualityScore(entry.memorization_quality || 'average'), 0) / recentEntries.length
      : 0;

    // Generate insights
    const insights = [];
    
    if (recentPages >= 15) {
      insights.push({
        type: "achievement",
        title: "Excellent Recent Progress",
        description: `Memorized ${recentPages} pages in the last month - outstanding effort!`,
        icon: "trophy"
      });
    } else if (recentPages >= 8) {
      insights.push({
        type: "good",
        title: "Good Recent Progress",
        description: `Steady memorization of ${recentPages} pages this month.`,
        icon: "check"
      });
    } else if (recentPages < 3) {
      insights.push({
        type: "concern",
        title: "Low Recent Activity",
        description: `Only ${recentPages} pages memorized recently. Consider increasing practice.`,
        icon: "alert"
      });
    }

    if (averageQuality >= 4.5) {
      insights.push({
        type: "achievement",
        title: "Excellent Quality",
        description: `Average quality of ${averageQuality.toFixed(1)}/5 shows mastery.`,
        icon: "star"
      });
    } else if (averageQuality < 2.5) {
      insights.push({
        type: "concern",
        title: "Quality Needs Improvement",
        description: `Average quality of ${averageQuality.toFixed(1)}/5 suggests more revision needed.`,
        icon: "alert"
      });
    }

    if (recentEntries.length >= 15) {
      insights.push({
        type: "good",
        title: "Consistent Practice",
        description: `${recentEntries.length} study sessions shows excellent consistency.`,
        icon: "calendar"
      });
    } else if (recentEntries.length < 8) {
      insights.push({
        type: "concern",
        title: "Inconsistent Practice",
        description: `Only ${recentEntries.length} sessions recently. More regular practice needed.`,
        icon: "alert"
      });
    }

    // Calculate average Juz per day
    const totalJuzProgress = progressData.reduce((sum, entry) => {
      return sum + (entry.current_juz || 0);
    }, 0);
    const averageJuzPerDay = progressData.length > 0 
      ? (totalJuzProgress / progressData.length) / 30 // Assuming average month has 30 days
      : 0;

    // Calculate recent average Juz per day (last 30 days)
    const recentJuzProgress = recentEntries.reduce((sum, entry) => {
      return sum + (entry.current_juz || 0);
    }, 0);
    const recentAverageJuzPerDay = recentEntries.length > 0 
      ? recentJuzProgress / Math.max(recentEntries.length, 1)
      : 0;

    if (recentAverageJuzPerDay >= 1.5) {
      insights.push({
        type: "achievement",
        title: "Excellent Juz Progress",
        description: `Averaging ${recentAverageJuzPerDay.toFixed(1)} Juz per session - outstanding pace!`,
        icon: "trophy"
      });
    } else if (recentAverageJuzPerDay >= 1.0) {
      insights.push({
        type: "good",
        title: "Good Juz Progress",
        description: `Averaging ${recentAverageJuzPerDay.toFixed(1)} Juz per session - steady pace.`,
        icon: "check"
      });
    } else if (recentAverageJuzPerDay < 0.5) {
      insights.push({
        type: "concern",
        title: "Slow Juz Progress",
        description: `Only ${recentAverageJuzPerDay.toFixed(1)} Juz per session. Consider increasing study intensity.`,
        icon: "alert"
      });
    }

    return {
      totalPages,
      totalRevisions,
      averageQuality,
      recentPages,
      recentQuality,
      totalEntries: progressData.length,
      recentEntries: recentEntries.length,
      insights,
      averageJuzPerDay,
      recentAverageJuzPerDay
    };
  };

  const analysis = generateProgressAnalysis();

  const getInsightIcon = (iconType: string) => {
    switch (iconType) {
      case "trophy": return <Award className="h-4 w-4" />;
      case "star": return <Award className="h-4 w-4" />;
      case "check": return <CheckCircle className="h-4 w-4" />;
      case "calendar": return <Calendar className="h-4 w-4" />;
      case "refresh": return <TrendingUp className="h-4 w-4" />;
      case "alert": return <AlertTriangle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  // Handler for student selection
  const handleStudentSelect = (studentId: string, _studentName: string) => {
    setSelectedStudentId(studentId);
    setActiveTab("entries");
    setViewMode("daily"); // Reset to daily view when selecting a student
  };

  const handleSendEmails = async () => {
    setIsSendingEmails(true);
    setShowEmailConfirmDialog(false);
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
        
        <AlertDialog open={showEmailConfirmDialog} onOpenChange={setShowEmailConfirmDialog}>
          <AlertDialogTrigger asChild>
            <Button disabled={isSendingEmails} size="sm">
              {isSendingEmails ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              <span className="hidden sm:inline">Send Daily Emails</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Email Send</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to send daily progress emails to all guardian email addresses? 
                This action will send progress reports for all students who have progress entries from the last 24 hours.
                <br /><br />
                <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSendEmails} className="bg-blue-600 hover:bg-blue-700">
                Yes, Send Emails
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Progress Summary & Analysis
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Detailed insights into {studentVerification?.name}'s learning progress
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-4">
                            {progressLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm">Analyzing progress data...</span>
                              </div>
                            ) : analysis ? (
                              <div className="space-y-6">
                                {/* Overall Statistics */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border">
                                    <div className="text-lg font-bold text-blue-700">{analysis.totalPages}</div>
                                    <div className="text-xs text-blue-600">Total Pages</div>
                                  </div>
                                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border">
                                    <div className="text-lg font-bold text-green-700">{analysis.totalRevisions}</div>
                                    <div className="text-xs text-green-600">Total Revisions</div>
                                  </div>
                                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border">
                                    <div className="text-lg font-bold text-purple-700">{analysis.averageQuality.toFixed(1)}</div>
                                    <div className="text-xs text-purple-600">Avg Quality</div>
                                  </div>
                                  <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border">
                                    <div className="text-lg font-bold text-orange-700">{analysis.totalEntries}</div>
                                    <div className="text-xs text-orange-600">Study Sessions</div>
                                  </div>
                                </div>

                                {/* Recent Performance */}
                                <div className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                    <h3 className="font-semibold text-gray-800 text-sm">Recent Performance (Last 30 Days)</h3>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                      <span>Pages Memorized:</span>
                                      <span className="font-medium text-blue-600">{analysis.recentPages}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Study Sessions:</span>
                                      <span className="font-medium text-green-600">{analysis.recentEntries}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Recent Quality:</span>
                                      <span className="font-medium text-purple-600">{analysis.recentQuality.toFixed(1)}/5</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Avg Juz/Session:</span>
                                      <span className="font-medium text-orange-600">{analysis.recentAverageJuzPerDay.toFixed(1)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Progress Visualization */}
                                <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                  <h3 className="font-semibold text-blue-800 mb-3 text-sm flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Progress Trend Visualization
                                  </h3>
                                  
                                  {/* Monthly Progress Bars */}
                                  <div className="space-y-3">
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Pages Progress</span>
                                        <span>{analysis.recentPages} pages (Recent)</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${Math.min((analysis.recentPages / 20) * 100, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Quality Rating</span>
                                        <span>{analysis.recentQuality.toFixed(1)}/5</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-500 ${
                                            analysis.recentQuality >= 4 ? 'bg-green-600' :
                                            analysis.recentQuality >= 3 ? 'bg-yellow-600' : 'bg-red-600'
                                          }`}
                                          style={{ width: `${(analysis.recentQuality / 5) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Study Consistency</span>
                                        <span>{analysis.recentEntries} sessions</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${Math.min((analysis.recentEntries / 20) * 100, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span>Juz Progress Rate</span>
                                        <span>{analysis.recentAverageJuzPerDay.toFixed(1)} per session</span>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${Math.min((analysis.recentAverageJuzPerDay / 2) * 100, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Performance Indicators */}
                                  <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="text-center p-2 bg-white/60 rounded">
                                      <div className={`text-xs font-medium ${
                                        analysis.recentPages >= 15 ? 'text-green-600' :
                                        analysis.recentPages >= 8 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {analysis.recentPages >= 15 ? '🏆 Excellent' :
                                         analysis.recentPages >= 8 ? '✅ Good' : '⚠️ Needs Work'}
                                      </div>
                                      <div className="text-xs text-gray-600">Memorization</div>
                                    </div>
                                    <div className="text-center p-2 bg-white/60 rounded">
                                      <div className={`text-xs font-medium ${
                                        analysis.recentQuality >= 4 ? 'text-green-600' :
                                        analysis.recentQuality >= 3 ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {analysis.recentQuality >= 4 ? '🏆 Excellent' :
                                         analysis.recentQuality >= 3 ? '✅ Good' : '⚠️ Needs Work'}
                                      </div>
                                      <div className="text-xs text-gray-600">Quality</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Key Insights */}
                                <div>
                                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                    <Target className="h-4 w-4" />
                                    Key Insights & Recommendations
                                  </h3>
                                  <div className="grid gap-3">
                                    {analysis.insights.map((insight, index) => (
                                      <div 
                                        key={index}
                                        className={`p-3 rounded-lg border-l-4 ${
                                          insight.type === 'achievement' 
                                            ? 'bg-green-50 border-green-400' 
                                            : insight.type === 'good'
                                            ? 'bg-blue-50 border-blue-400'
                                            : 'bg-orange-50 border-orange-400'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          <div className={`mt-0.5 ${
                                            insight.type === 'achievement' 
                                              ? 'text-green-600' 
                                              : insight.type === 'good'
                                              ? 'text-blue-600'
                                              : 'text-orange-600'
                                          }`}>
                                            {getInsightIcon(insight.icon)}
                                          </div>
                                          <div>
                                            <h4 className={`font-medium text-sm ${
                                              insight.type === 'achievement' 
                                                ? 'text-green-800' 
                                                : insight.type === 'good'
                                                ? 'text-blue-800'
                                                : 'text-orange-800'
                                            }`}>
                                              {insight.title}
                                            </h4>
                                            <p className={`text-xs ${
                                              insight.type === 'achievement' 
                                                ? 'text-green-700' 
                                                : insight.type === 'good'
                                                ? 'text-blue-700'
                                                : 'text-orange-700'
                                            }`}>
                                              {insight.description}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Action Plan */}
                                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                                  <h3 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Teacher Action Plan
                                  </h3>
                                  <div className="text-xs text-indigo-700 space-y-1">
                                    {analysis.averageQuality < 3.5 && (
                                      <p>• Schedule additional revision sessions to improve quality</p>
                                    )}
                                    {analysis.recentEntries < 10 && (
                                      <p>• Encourage more frequent practice - aim for daily sessions</p>
                                    )}
                                    {analysis.recentPages < 8 && (
                                      <p>• Set weekly memorization targets to maintain momentum</p>
                                    )}
                                    {analysis.recentAverageJuzPerDay < 1 && (
                                      <p>• Increase daily study sessions to cover more Juz content</p>
                                    )}
                                    {analysis.insights.filter(i => i.type === 'achievement').length > 0 && (
                                      <p>• Acknowledge and celebrate excellent progress to maintain motivation</p>
                                    )}
                                    <p>• Monitor progress weekly and adjust teaching strategies as needed</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Progress Data</h3>
                                <p className="text-sm text-gray-600">
                                  No Dhor Book entries found for {studentVerification?.name} in the last 6 months.
                                  Start recording daily progress to see detailed analysis here.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="analytics" className="mt-3 sm:mt-4">
                        <Card>
                          <CardHeader className="p-3 sm:p-4 md:p-6">
                            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Progress Analytics
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Advanced metrics and performance trends for {studentVerification?.name}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                            {progressLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="ml-2 text-sm">Loading analytics...</span>
                              </div>
                            ) : progressData && progressData.length > 0 ? (
                              <div className="space-y-4">
                                {/* Progress Trends */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      Time-based Analysis
                                    </h4>
                                    <div className="text-xs space-y-1">
                                      <p>Total Days Active: <span className="font-medium">{progressData.length}</span></p>
                                      <p>Data Range: <span className="font-medium">Last 6 months</span></p>
                                      <p>Average Sessions/Week: <span className="font-medium">{((progressData.length / 26) * 7).toFixed(1)}</span></p>
                                    </div>
                                  </div>

                                  <div className="p-4 border rounded-lg">
                                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                      <BookOpen className="h-4 w-4" />
                                      Memorization Metrics
                                    </h4>
                                    <div className="text-xs space-y-1">
                                      {analysis && (
                                        <>
                                          <p>Pages/Session: <span className="font-medium">{(analysis.totalPages / analysis.totalEntries).toFixed(2)}</span></p>
                                                                                     <p>Juz Progress Rate: <span className="font-medium">{analysis.recentAverageJuzPerDay.toFixed(1)} per session</span></p>
                                          <p>Quality Consistency: <span className="font-medium">{analysis.averageQuality > 3.5 ? 'High' : analysis.averageQuality > 2.5 ? 'Medium' : 'Needs Work'}</span></p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Quality Distribution */}
                                <div className="p-4 border rounded-lg">
                                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Quality Rating Distribution
                                  </h4>
                                  <div className="grid grid-cols-5 gap-2 text-xs">
                                    {['excellent', 'good', 'average', 'needsWork', 'horrible'].map((quality) => {
                                      const count = progressData.filter(entry => entry.memorization_quality === quality).length;
                                      const percentage = progressData.length > 0 ? (count / progressData.length * 100).toFixed(0) : 0;
                                                                              return (
                                          <div key={quality} className="text-center p-2 bg-gray-50 rounded">
                                            <div className="font-medium">{count}</div>
                                            <div className="text-xs text-gray-600 capitalize">{quality === 'needsWork' ? 'Needs Work' : quality}</div>
                                            <div className="text-xs text-gray-500">{percentage}%</div>
                                          </div>
                                        );
                                    })}
                                  </div>
                                </div>

                                {/* Performance Recommendations */}
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <h4 className="font-medium text-sm mb-2 text-blue-800 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Data-Driven Recommendations
                                  </h4>
                                  <div className="text-xs text-blue-700 space-y-1">
                                    {analysis && (
                                      <>
                                        {analysis.totalEntries < 20 && (
                                          <p>• Increase session frequency - current data shows room for more consistent practice</p>
                                        )}
                                        {analysis.averageQuality < 3.0 && (
                                          <p>• Focus on quality over quantity - current average suggests need for better preparation</p>
                                        )}
                                                                                 {analysis.recentAverageJuzPerDay < 0.8 && (
                                           <p>• Encourage more intensive study sessions to improve Juz completion rate</p>
                                         )}
                                        <p>• Continue tracking daily entries for more accurate long-term analysis</p>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analytics Data</h3>
                                <p className="text-sm text-gray-600">
                                  Analytics will appear once progress entries are recorded for {studentVerification?.name}.
                                  Start with daily Dhor Book entries to generate meaningful insights.
                                </p>
                              </div>
                            )}
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
