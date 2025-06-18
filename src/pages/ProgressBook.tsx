
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
} from "lucide-react";
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
    enabled: isAdmin, // Only fetch all teachers if the user is an admin
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
            .select("student_id")
            .eq("teacher_id", selectedTeacherId);

          if (teacherStudentsError) {
            console.error(
              "Error fetching student IDs for teacher",
              teacherStudentsError,
            );
            return [];
          }
          const ids = teacherStudents.map((s) => s.student_id);
          query = query.in("id", ids);
        }
      } else if (currentTeacherId && userProfileData.section) {
        const { data: studentLinks, error: linkError } = await supabase
          .from("students_teachers")
          .select("student_id")
          .eq("teacher_id", currentTeacherId);

        if (linkError) {
          console.error("Error fetching teacher's students", linkError);
          return [];
        }

        const studentIds = studentLinks.map((link) => link.student_id);

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

  const filteredStudents = students?.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
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

      <Card className="overflow-hidden shadow-lg border-0 bg-white">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <CardContent className="p-4 sm:p-6">
            <Tabs
              value={viewMode}
              onValueChange={(value) =>
                setViewMode(value as "daily" | "classroom")}
            >
              <div className="mb-4 sm:mb-6">
                <TabsList className="w-full grid grid-cols-2 bg-white shadow-sm border">
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
                      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          Filter by Teacher
                        </h3>
                        <Select
                          value={selectedTeacherId}
                          onValueChange={(id) =>
                            setSelectedTeacherId(id === "all" ? undefined : id)}
                        >
                          <SelectTrigger className="w-full bg-white">
                            <SelectValue placeholder="All Teachers" />
                          </SelectTrigger>
                          <SelectContent>
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
                    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        Select Student
                      </h3>
                      <div className="relative w-full sm:w-auto mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search students..."
                          className="pl-10 w-full bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {studentsLoading
                        ? (
                          <div className="flex items-center text-sm text-gray-600 p-3 border rounded-lg bg-white/50">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading students...
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
                                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                                    selectedStudentId === student.id
                                      ? "bg-blue-600 text-white font-semibold"
                                      : "bg-white/50 hover:bg-white"
                                  }`}
                                >
                                  {student.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )
                        : (
                          <div className="flex items-center text-sm text-amber-700 p-3 border border-amber-200 rounded-lg bg-amber-50">
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
                        <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
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
                        </Card>
                      )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="classroom" className="mt-4 sm:mt-6">
                {isAdmin && (
                  <Card className="p-4 mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-green-600" />
                      Select Teacher for Classroom View
                    </h3>
                    <Select 
                      value={selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined)} 
                      onValueChange={setSelectedTeacherId}
                    >
                      <SelectTrigger className="bg-white border-green-200 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
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
  );
};

export default ProgressBookPage;
