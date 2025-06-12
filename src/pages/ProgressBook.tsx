
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { DhorBook as DhorBookComponent } from "@/components/dhor-book/DhorBook.tsx";
import { ClassroomRecords } from "@/components/dhor-book/ClassroomRecords.tsx";
import { TeacherStatsSection } from "@/components/teachers/TeacherStatsSection.tsx";
import { AlertCircle, Book, CalendarDays, FileText, Loader2, Search, Users, BookOpen, TrendingUp, Download } from "lucide-react";
import { useTeacherStatus } from "@/hooks/useTeacherStatus.ts";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useIsMobile } from "@/hooks/use-mobile";

const ProgressBookPage = () => {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"daily" | "classroom">("daily");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const { isAdmin, teacherId } = useTeacherStatus();

  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const studentIdParam = urlParams.get("studentId");
    if (studentIdParam) {
      setSelectedStudentId(studentIdParam);
    }
  }, []);

  const { data: teachers } = useQuery({
    queryKey: ["active-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name")
        .eq("role", "teacher")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return data || [];
    }
  });

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

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: [
      "students-for-progress-book",
      { isAdmin, userMadrassahId: teacherData?.madrassah_id },
    ],
    queryFn: async () => {
      if (!teacherData?.madrassah_id) return [];

      let query = supabase
        .from("students")
        .select("id, name, status")
        .eq("status", "active")
        .not("madrassah_id", "is", null)
        .eq("madrassah_id", teacherData.madrassah_id);

      if (!isAdmin) {
        // Teacher view: also filter by the logged-in teacher's section
        if (teacherData.section) {
          query = query.eq("section", teacherData.section);
        } else {
          // If teacher has no section, they see no students.
          return [];
        }
      }

      query = query.order("name", { ascending: true });

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error fetching students",
          description: "Could not retrieve student data.",
          variant: "destructive"
        });
        return [];
      }
      return data || [];
    },

    enabled: !isLoadingTeacher && !!teacherData,
    refetchInterval: 30000,
  });

  const currentTeacherId = teacherId;

  useRealtimeLeaderboard(currentTeacherId ?? undefined, () => {
    // Intentionally empty, realtime updates might trigger refetch of other queries if needed
  });
  
  const filteredStudents = students?.filter(student => student.name.toLowerCase().includes(searchQuery.toLowerCase()));
  
  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Progress Book
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Track and monitor student memorization progress
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="overflow-hidden shadow-lg border-0 bg-white">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <Tabs value={viewMode} onValueChange={value => setViewMode(value as "daily" | "classroom")}>
              <div className="mb-4 sm:mb-6">
                <TabsList className="w-full grid grid-cols-2 bg-white shadow-sm border">
                  <TabsTrigger value="daily" className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <CalendarDays className="h-4 w-4" />
                    <span>Daily Records</span>
                  </TabsTrigger>
                  <TabsTrigger value="classroom" className="flex items-center gap-2 text-sm sm:text-base py-2 sm:py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Users className="h-4 w-4" />
                    <span>Leaderboard View</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="daily" className="space-y-4 sm:space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                    <div className="overflow-x-auto">
                      <TabsList className="flex-nowrap w-full sm:w-auto bg-gray-100">
                        <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          All Students
                        </TabsTrigger>
                        <TabsTrigger value="recent" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Recent Entries
                        </TabsTrigger>
                        <TabsTrigger value="reports" className="text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Reports
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input placeholder="Search students..." className="pl-10 w-full sm:w-[250px] md:w-[300px] bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                  </div>

                  <TabsContent value="all" className="mt-4 sm:mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                      <div className="lg:col-span-1 space-y-4">
                        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Users className="h-4 w-4 mr-2 text-blue-600" />
                            Select Student
                          </h3>
                          {studentsLoading ? <div className="flex items-center text-sm text-gray-600 p-3 border rounded-lg bg-white/50">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading students...
                            </div> : students && students.length > 0 ? <Select value={selectedStudentId || undefined} onValueChange={setSelectedStudentId}>
                                <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue placeholder="Choose a student" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-200 shadow-lg">
                                  {filteredStudents?.map(student => <SelectItem key={student.id} value={student.id} className="focus:bg-blue-50 focus:text-blue-900">
                                      {student.name}
                                    </SelectItem>)}
                                </SelectContent>
                              </Select> : <div className="flex items-center text-sm text-amber-700 p-3 border border-amber-200 rounded-lg bg-amber-50">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                No active students found
                              </div>}
                        </Card>

                        {isAdmin && <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Users className="h-4 w-4 mr-2 text-green-600" />
                              Filter by Teacher
                            </h3>
                            <Select value={selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined)} onValueChange={setSelectedTeacherId}>
                              <SelectTrigger className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500">
                                <SelectValue placeholder="All Teachers" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200 shadow-lg">
                                <SelectItem value="all" className="focus:bg-green-50 focus:text-green-900">
                                  All Teachers
                                </SelectItem>
                                {teachers?.map(teacher => <SelectItem key={teacher.id} value={teacher.id} className="focus:bg-green-50 focus:text-green-900">
                                    {teacher.name}
                                  </SelectItem>)}
                                {(!teachers || teachers.length === 0) && <SelectItem value="no-teachers" disabled>
                                    No teachers found
                                  </SelectItem>}
                              </SelectContent>
                            </Select>
                          </Card>}
                      </div>

                      <div className="lg:col-span-3">
                        {selectedStudentId ? <DhorBookComponent studentId={selectedStudentId} teacherId={currentTeacherId || "default"} isAdmin={isAdmin} isLoadingTeacher={isLoadingTeacher} /> : <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <Book className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                  Ready to Track Progress
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600 max-w-md">
                                  Select a student from the sidebar to view their memorization progress, 
                                  add new entries, and track their Quranic journey.
                                </p>
                              </div>
                            </div>
                          </Card>}
                      </div>
                    </div>

                  </TabsContent>

                  <TabsContent value="recent" className="mt-4 sm:mt-6">
                    <Card className="p-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Recent Activity
                          </h3>
                          <p className="text-gray-600">
                            Recent progress entries will be displayed here.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reports" className="mt-4 sm:mt-6">
                    <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Progress Reports
                          </h3>
                          <p className="text-gray-600">
                            Comprehensive progress reports will be generated here.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="classroom" className="mt-4 sm:mt-6">
                {isAdmin && <Card className="p-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-600" />
                      Select Teacher for Classroom View
                    </h3>
                    <Select value={selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined)} onValueChange={setSelectedTeacherId}>
                      <SelectTrigger className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 shadow-lg">
                        <SelectItem value="all" className="focus:bg-green-50 focus:text-green-900">
                          All Teachers
                        </SelectItem>
                        {teachers?.map(teacher => <SelectItem key={teacher.id} value={teacher.id} className="focus:bg-green-50 focus:text-green-900">
                            {teacher.name}
                          </SelectItem>)}
                        {(!teachers || teachers.length === 0) && <SelectItem value="no-teachers" disabled>
                            No teachers found
                          </SelectItem>}
                      </SelectContent>
                    </Select>
                  </Card>}
                <ClassroomRecords teacherId={currentTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : "default")} isAdmin={isAdmin} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default ProgressBookPage;
