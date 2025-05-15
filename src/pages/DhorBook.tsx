
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DhorBook as DhorBookComponent } from "@/components/dhor-book/DhorBook";
import { ClassroomRecords } from "@/components/dhor-book/ClassroomRecords";
import { TeacherStatsSection } from "@/components/teachers/TeacherStatsSection";
import { Book, Search, Activity, Users } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useTeacherStatus } from "@/hooks/useTeacherStatus";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";

const DhorBookPage = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"daily" | "classroom">("daily");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const { isAdmin, isTeacher } = useTeacherStatus();

  // Fetch the teacher ID for the current user if they are a teacher
  const { data: teacherData, isLoading: teacherLoading } = useQuery({
    queryKey: ['current-teacher'],
    queryFn: async () => {
      if (!isTeacher) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return null;

      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('email', session.user.email)
        .single();
        
      if (error) {
        console.error("Error fetching teacher data:", error);
        return null;
      }
      
      return data;
    },
    enabled: isTeacher,
  });

  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching students:", error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch active teachers for the teacher selector
  const { data: teachers } = useQuery({
    queryKey: ['active-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching teachers:", error);
        return [];
      }
      return data || [];
    }
  });

  // Set up realtime updates to ensure both tabs are in sync
  const currentTeacherId = isTeacher 
    ? teacherData?.id 
    : (selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0].id : undefined));
  
  const { isSubscribed } = useRealtimeLeaderboard(currentTeacherId, () => {
    console.log("Realtime update detected in DhorBook page, refreshing data");
  });
  
  console.log("Current view mode:", viewMode, "teacherId:", currentTeacherId, "realtime subscribed:", isSubscribed);

  // Filter students based on search query
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Progress Book System</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Comprehensive student progress tracking through Dhor Book entries
            </p>
          </div>
          <Button size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
            <Book className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Export Records</span>
          </Button>
        </div>

        <TeacherStatsSection stats={{
          totalTeachers: teachers?.length || 0,
          totalStudents: students?.length || 0,
          averageExperience: 0,
          subjectCount: 0,
          activeTeachers: 0,
          totalClasses: 0
        }} />

        {/* View mode tabs */}
        <Card className="mt-4 sm:mt-6">
          <CardContent className="p-3 sm:p-6">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "classroom")}>
              <div className="mb-4 sm:mb-6">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="daily" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Book className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Daily Records</span>
                  </TabsTrigger>
                  <TabsTrigger value="classroom" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Classroom Records</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="daily">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="overflow-x-auto w-full sm:w-auto">
                      <TabsList className="flex-nowrap min-w-max">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">All Students</TabsTrigger>
                        <TabsTrigger value="recent" className="text-xs sm:text-sm">Recent Entries</TabsTrigger>
                        <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        className="pl-7 sm:pl-8 w-full sm:w-[250px] text-xs sm:text-sm h-8 sm:h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6 mt-3 sm:mt-4">
                      <div className="md:col-span-1">
                        <div className="space-y-3 sm:space-y-4">
                          <div>
                            <h3 className="mb-1 sm:mb-2 text-xs sm:text-sm font-medium">Select a student</h3>
                            <Select
                              value={selectedStudentId || undefined}
                              onValueChange={setSelectedStudentId}
                            >
                              <SelectTrigger className="text-xs sm:text-sm">
                                <SelectValue placeholder="Choose a student" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredStudents?.map(student => (
                                  <SelectItem key={student.id} value={student.id} className="text-xs sm:text-sm">
                                    {student.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {isAdmin && (
                            <div>
                              <h3 className="mb-1 sm:mb-2 text-xs sm:text-sm font-medium">Select teacher</h3>
                              <Select
                                value={selectedTeacherId || (teachers?.[0]?.id || undefined)}
                                onValueChange={setSelectedTeacherId}
                              >
                                <SelectTrigger className="text-xs sm:text-sm">
                                  <SelectValue placeholder="Choose a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teachers?.map(teacher => (
                                    <SelectItem key={teacher.id} value={teacher.id} className="text-xs sm:text-sm">
                                      {teacher.name}
                                    </SelectItem>
                                  ))}
                                  {(!teachers || teachers.length === 0) && (
                                    <SelectItem value="default" className="text-xs sm:text-sm">Default Teacher</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="md:col-span-3">
                        {selectedStudentId ? (
                          <DhorBookComponent 
                            studentId={selectedStudentId} 
                            teacherId={isTeacher ? teacherData?.id : (selectedTeacherId || teachers?.[0]?.id || 'default')} 
                          />
                        ) : (
                          <div className="border rounded-lg flex items-center justify-center h-[300px] sm:h-[400px] bg-muted/20">
                            <div className="text-center">
                              <Book className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
                              <h3 className="text-base sm:text-lg font-medium mb-1">No Student Selected</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                                Select a student from the sidebar to view or edit their Dhor Book entries.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recent">
                    <div className="mt-3 sm:mt-4">
                      <p className="text-muted-foreground text-center py-8 sm:py-10 text-xs sm:text-sm">
                        Recent Dhor Book entries across all students will be displayed here.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reports">
                    <div className="mt-3 sm:mt-4">
                      <p className="text-muted-foreground text-center py-8 sm:py-10 text-xs sm:text-sm">
                        Generate and view reports based on Dhor Book data.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="classroom">
                {currentTeacherId ? (
                  <ClassroomRecords teacherId={currentTeacherId} />
                ) : (
                  <div className="border rounded-lg p-6 sm:p-8 text-center">
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {teacherLoading ? 
                        "Loading teacher information..." : 
                        "Please select a teacher to view classroom records."}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DhorBookPage;
