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
import { MonthlyProgress } from "@/components/progress/MonthlyProgress.tsx";
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

  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"daily" | "classroom" | "monthly">("daily");
  const [selectedTeacherId, setSelectedTeacherId] = useState<
    string | undefined
  >(undefined);

  const { isAdmin, teacherId: currentTeacherId } = useTeacherStatus();
  const { session } = useAuth();
  const userId = session?.user?.id;

  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search);
    const studentIdParam = urlParams.get("studentId");
    setSelectedStudentId(studentIdParam === null ? undefined : studentIdParam);
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
          const { data: studentLinks, error: studentIdError } = await supabase
            .from("students_teachers")
            .select("student_name")
            .eq("teacher_id", selectedTeacherId);

          if (studentIdError) {
            console.error(
              "Error fetching student names for teacher",
              studentIdError,
            );
            return [];
          }
          const studentNames = studentLinks.map((s) => s.student_name);
          if (studentNames.length === 0) return [];

          const { data: studentIds, error: studentError } = await supabase
            .from("students")
            .select("id")
            .in("name", studentNames);

          if (studentError) {
            console.error(
              "Error fetching student IDs by name",
              studentError,
            );
            return [];
          }

          const ids = studentIds.map((s) => s.id);
          query = query.in("id", ids);
        }
      } else if (currentTeacherId && userProfileData.section) {
        const { data: studentLinks, error: linkError } = await supabase
          .from("students_teachers")
          .select("student_name")
          .eq("teacher_id", currentTeacherId);

        if (linkError) {
          console.error("Error fetching teacher's students", linkError);
          return [];
        }

        const studentNames = studentLinks.map((link) => link.student_name);
        if (studentNames.length === 0) return [];
        
        const { data: studentIds, error: studentError } = await supabase
            .from("students")
            .select("id")
            .in("name", studentNames);

        if (studentError) {
            console.error(
              "Error fetching student IDs by name",
              studentError,
            );
            return [];
        }

        const studentIdsResult = studentIds.map((s) => s.id);

        if (studentIdsResult.length === 0) {
          return [];
        }

        query = query.in("id", studentIdsResult).ilike("section", userProfileData.section);
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
      <div className="flex items-center gap-4">
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

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "classroom" | "monthly")} className="w-full">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
          <TabsTrigger value="daily">Daily Records</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Progress</TabsTrigger>
          <TabsTrigger value="classroom">Leaderboard View</TabsTrigger>
        </TabsList>
        <TabsContent value="daily">
          <Card className="mt-4">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {isAdmin && (
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Filter by Teacher</h3>
                        <Select onValueChange={(id) => setSelectedTeacherId(id === "all" ? undefined : id)}>
                          <SelectTrigger><SelectValue placeholder="All Teachers" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Teachers</SelectItem>
                            {teachers?.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  )}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Select Student</h3>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search students..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {studentsLoading ? (
                        <div><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</div>
                      ) : (
                        <ul className="space-y-2 max-h-96 overflow-y-auto">
                          {filteredStudents?.map((student) => (
                            <li key={student.id}>
                              <button
                                onClick={() => setSelectedStudentId(student.id)}
                                className={`w-full text-left p-2 rounded-md text-sm ${selectedStudentId === student.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                              >
                                {student.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-3">
                  {selectedStudentId ? (
                    <DhorBookComponent
                      studentId={selectedStudentId}
                      teacherId={currentTeacherId || ""}
                      isAdmin={isAdmin}
                      isLoadingTeacher={isLoadingUserProfile}
                      teacherData={userProfileData}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full rounded-lg bg-gray-50 p-8 text-center">
                      <div>
                        <Book className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-800">Select a Student</h3>
                        <p className="text-sm text-gray-600">Choose a student from the list to view their detailed progress.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly">
          <Card className="mt-4">
            <CardContent className="p-4 sm:p-6">
              <MonthlyProgress
                isAdmin={isAdmin}
                teacherId={selectedTeacherId ?? (currentTeacherId || undefined)}
                userProfileData={userProfileData}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="classroom">
          <Card className="mt-4">
            <CardContent className="p-4 sm:p-6">
              {isAdmin && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Select Teacher for Classroom View</h3>
                  <Select onValueChange={setSelectedTeacherId}>
                    <SelectTrigger><SelectValue placeholder="Choose a teacher" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ClassroomRecords teacherId={selectedTeacherId ?? (currentTeacherId || undefined)} isAdmin={isAdmin} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressBookPage;
