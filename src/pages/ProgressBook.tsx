import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { DhorBook as DhorBookComponent } from "@/components/dhor-book/DhorBook.tsx";
import { ClassroomRecords } from "@/components/dhor-book/ClassroomRecords.tsx";
import {
  Book,
  BookOpen,
  CalendarDays,
  FileText,
  Loader2,
  Search,
  TrendingUp,
  Users,
  GraduationCap,
  BarChart3,
  Download,
  Filter,
  MoreVertical,
  Plus,
  Award,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { useTeacherStatus } from "@/hooks/useTeacherStatus.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.tsx";

const ProgressBookPage = () => {
  const { toast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"daily" | "classroom">("daily");
  const [selectedTeacherId, setSelectedTeacherId] = useState<
    string | undefined
  >(undefined);

  const { isAdmin, teacherId: currentTeacherId } = useTeacherStatus();
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const studentIdParam = urlParams.get("studentId");
    if (studentIdParam) {
      setSelectedStudentId(studentIdParam);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin && currentTeacherId) {
      setSelectedTeacherId(currentTeacherId);
    }
  }, [isAdmin, currentTeacherId]);

  const { data: teachers } = useQuery({
    queryKey: ["active-teachers", "role", "teacher"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name")
        .eq("role", "teacher")
        .order("name", { ascending: true });
      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: userProfileData, isLoading: isLoadingUserProfile } = useQuery({
    queryKey: ["userProfileForProgressBook", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("madrassah_id, section")
        .eq("id", userId)
        .single();
      if (error) {
        console.error("Error fetching user profile data:", error);
        throw error;
      }
      return data;
    },
    enabled: !!userId,
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: [
      "students-for-progress-book",
      {
        isAdmin,
        userMadrassahId: userProfileData?.madrassah_id,
        selectedTeacherId: isAdmin ? selectedTeacherId : currentTeacherId,
      },
    ],
    queryFn: async () => {
      if (!userProfileData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .eq("madrassah_id", userProfileData.madrassah_id);

      if (isAdmin) {
        if (selectedTeacherId && selectedTeacherId !== "all") {
          const { data: teacherStudents, error: teacherStudentsError } = await supabase
            .from("students_teachers")
            .select("id")
            .eq("teacher_id", selectedTeacherId);

          if (teacherStudentsError) {
            console.error(
              "Error fetching student IDs for teacher",
              teacherStudentsError,
            );
            return [];
          }
          const ids = teacherStudents.map((s) => s.id);
          query = query.in("id", ids);
        }
      } else if (currentTeacherId && userProfileData.section) {
        const { data: studentLinks, error: linkError } = await supabase
          .from("students_teachers")
          .select("id")
          .eq("teacher_id", currentTeacherId);

        if (linkError) {
          console.error("Error fetching teacher's students", linkError);
          return [];
        }

        const studentIds = studentLinks.map((link) => link.id);

        if (studentIds.length === 0) {
          return [];
        }

        query = query.in("id", studentIds).eq("section", userProfileData.section);
      } else {
        return [];
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error fetching students",
          description: "Could not retrieve student data.",
          variant: "destructive",
        });
        return [];
      }
      return data || [];
    },
    enabled: !isLoadingUserProfile && !!userProfileData,
  });

  // Fetch progress statistics
  const { data: progressStats, isLoading: statsLoading } = useQuery({
    queryKey: ["progress-stats", userProfileData?.madrassah_id],
    queryFn: async () => {
      if (!userProfileData?.madrassah_id) return null;

      const [progressResult, revisionsResult, studentsCountResult] = await Promise.all([
        supabase.from("progress").select("id", { count: "exact" }),
        supabase.from("juz_revisions").select("id", { count: "exact" }),
        supabase.from("students").select("id", { count: "exact" }).eq("status", "active").eq("madrassah_id", userProfileData.madrassah_id),
      ]);

      return {
        totalProgress: progressResult.count || 0,
        totalRevisions: revisionsResult.count || 0,
        activeStudents: studentsCountResult.count || 0,
        completionRate: 87, // Mock data for now
      };
    },
    enabled: !!userProfileData?.madrassah_id,
  });

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen admin-theme p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-100">
                  Progress Book
                </h1>
                <p className="text-gray-400 text-sm lg:text-base">
                  Track and monitor student memorization progress
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 admin-btn-secondary"
                  size="lg"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="admin-theme">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Progress
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              className="gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base font-medium"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Entry</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Progress Entries</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 bg-white/10" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-100">
                      {progressStats?.totalProgress || 0}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Book className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Active Students</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 bg-white/10" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-100">
                      {progressStats?.activeStudents || 0}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Total Revisions</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 bg-white/10" />
                  ) : (
                    <div className="text-2xl font-bold text-gray-100">
                      {progressStats?.totalRevisions || 0}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-stats-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Completion Rate</p>
                  {statsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-16 bg-white/10" />
                      <Skeleton className="h-2 w-full bg-white/10" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-gray-100">
                        {progressStats?.completionRate || 0}%
                      </div>
                      <Progress
                        value={progressStats?.completionRate || 0}
                        className="h-2 bg-white/10"
                      />
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="admin-card bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="bg-white/5 border-b border-white/10">
            <CardContent className="p-4 sm:p-6">
              <Tabs
                value={viewMode}
                onValueChange={(value) =>
                  setViewMode(value as "daily" | "classroom")}
              >
                <div className="mb-4 sm:mb-6">
                  <TabsList className="w-full grid grid-cols-2 bg-white/10 shadow-sm border border-white/20">
                    <TabsTrigger
                      value="daily"
                      className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>Daily Records</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="classroom"
                      className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4" />
                      <span>Leaderboard View</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="daily" className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="lg:col-span-1 space-y-4">
                      {isAdmin && (
                        <Card className="p-4 bg-white/5 border border-white/10">
                          <h3 className="font-semibold text-gray-100 mb-3 flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-blue-400" />
                            Filter by Teacher
                          </h3>
                          <Select
                            value={selectedTeacherId}
                            onValueChange={(id) =>
                              setSelectedTeacherId(id === "all" ? undefined : id)}
                          >
                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-gray-200">
                              <SelectValue placeholder="All Teachers" />
                            </SelectTrigger>
                            <SelectContent className="admin-theme">
                              <SelectItem value="all">All Teachers</SelectItem>
                              {teachers?.map((teacher) => (
                                <SelectItem key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Card>
                      )}
                      
                      <Card className="p-4 bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-100 flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-400" />
                            Students
                          </h3>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {filteredStudents?.length || 0}
                          </Badge>
                        </div>
                        
                        <div className="relative w-full sm:w-auto mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search students..."
                            className="pl-10 w-full bg-white/5 border-white/10 focus:border-blue-500/50 text-gray-200 placeholder:text-gray-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        
                        {studentsLoading
                          ? (
                            <div className="space-y-2">
                              {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full bg-white/10" />
                              ))}
                            </div>
                          )
                          : filteredStudents && filteredStudents.length > 0
                          ? (
                            <ul className="space-y-2 max-h-96 overflow-y-auto">
                              {filteredStudents.map((student) => (
                                <li key={student.id}>
                                  <button
                                    onClick={() =>
                                      setSelectedStudentId(student.id)}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 ${
                                      selectedStudentId === student.id
                                        ? "bg-blue-600 text-white font-semibold shadow-lg"
                                        : "bg-white/5 hover:bg-white/10 text-gray-200"
                                    }`}
                                  >
                                    {student.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )
                          : (
                            <div className="flex items-center text-sm text-amber-300 p-3 border border-amber-500/30 rounded-lg bg-amber-500/10">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              No active students found.
                            </div>
                          )}
                      </Card>
                    </div>
                    
                    <div className="lg:col-span-3">
                      {selectedStudentId
                        ? (
                          <DhorBookComponent
                            studentId={selectedStudentId}
                            teacherId={currentTeacherId || ""}
                            isAdmin={isAdmin}
                            isLoadingTeacher={isLoadingUserProfile}
                            teacherData={userProfileData}
                          />
                        )
                        : (
                          <Card className="p-8 sm:p-12 text-center bg-white/5 border border-white/10">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <Book className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-100 mb-2">
                                  Ready to Track Progress
                                </h3>
                                <p className="text-sm sm:text-base text-gray-400 max-w-md">
                                  Select a student from the sidebar to view their memorization progress, 
                                  add new entries, and track their Quranic journey.
                                </p>
                              </div>
                            </div>
                          </Card>
                        )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="classroom" className="mt-4 sm:mt-6">
                  {isAdmin && (
                    <Card className="p-4 mb-4 bg-white/5 border border-white/10">
                      <h3 className="font-semibold text-gray-100 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-green-400" />
                        Select Teacher for Classroom View
                      </h3>
                      <Select 
                        value={selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined)} 
                        onValueChange={setSelectedTeacherId}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-gray-200 focus:border-green-500/50">
                          <SelectValue placeholder="Choose a teacher" />
                        </SelectTrigger>
                        <SelectContent className="admin-theme">
                          <SelectItem value="all">All Teachers</SelectItem>
                          {teachers?.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Card>
                  )}
                  <ClassroomRecords 
                    teacherId={currentTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : "default")} 
                    isAdmin={isAdmin} 
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default ProgressBookPage;
