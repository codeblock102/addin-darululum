/**
 * @file src/pages/ProgressBook.tsx
 * @summary This page provides a comprehensive interface for tracking student academic progress.
 * It allows users (teachers and admins) to view and manage daily progress entries for individual students
 * (sabaq, sabaq para, dhor) and also offers a classroom-wide overview of student activity for a selected date.
 * 
 * Key Features:
 * - Two main view modes: "Daily Records" for individual student focus and "Classroom View" for a broader look.
 * - In "Daily Records" mode:
 *   - Student selection dropdown, with search functionality.
 *   - Tabbed interface for "All Students" (to select a student), "Recent Entries", and "Reports" (placeholders).
 *   - Displays the `DhorBookComponent` (to be renamed ProgressBookComponent) for the selected student, showing their daily entries.
 *   - Admins can filter by teacher.
 * - In "Classroom View" mode:
 *   - Displays the `ClassroomRecords` component, showing a summary of all students' progress for a selected date.
 *   - Admins can select a specific teacher to view their classroom or see all students.
 * - Fetches necessary data: list of active students, list of teachers (for admins).
 * - Handles student ID selection from URL parameters for direct linking.
 * - Includes a `TeacherStatsSection` for displaying aggregate statistics (currently basic).
 * - Utilizes realtime updates via `useRealtimeLeaderboard` (though its direct impact here might be for other parts of the system).
 */
import React from 'react';
import { useState, useEffect } from "react";
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
import { Book, Search, Users, AlertCircle, Loader2, FileText, CalendarDays } from "lucide-react";
import { useTeacherStatus } from "@/hooks/useTeacherStatus.ts";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard.ts";
import { useToast } from "@/hooks/use-toast.ts";

/**
 * @component ProgressBookPage
 * @description The main page component for the Progress Book feature.
 * 
 * Renders a layout that allows users to view and manage student progress records.
 * It includes student selection, teacher filtering (for admins), and different views
 * for individual student details and classroom overviews.
 * 
 * State Management:
 *  - `selectedStudentId`: Stores the ID of the currently selected student for detailed view.
 *  - `searchQuery`: Holds the current text entered in the student search input.
 *  - `activeTab`: Manages the active tab within the "Daily Records" view (e.g., "all", "recent", "reports").
 *  - `viewMode`: Switches between "daily" records view and "classroom" overview.
 *  - `selectedTeacherId`: Stores the ID of the teacher selected by an admin for filtering.
 *
 * Data Fetching:
 *  - Fetches a list of all active teachers (`useQuery(['active-teachers'])`).
 *  - Fetches a list of all active students (`useQuery(['all-students-for-progress-book'])`).
 *
 * Effects:
 *  - Populates `selectedStudentId` from URL parameters on initial load.
 *  - Sets `selectedTeacherId` to the current teacher's ID if the user is a teacher.
 * 
 * Child Components:
 *  - `DashboardLayout`: Provides the overall page structure with sidebar and header.
 *  - `TeacherStatsSection`: Displays summary statistics related to teachers and students.
 *  - `DhorBookComponent` (to be renamed `ProgressBookComponent`): Displays detailed progress entries for a single student.
 *  - `ClassroomRecords`: Shows a tabular view of progress for all students in a classroom setting for a specific date.
 *  - Various UI components from `@/components/ui` (Card, Tabs, Select, Button, Input).
 * 
 * @returns {JSX.Element} The rendered Progress Book page.
 */
const ProgressBookPage = () => {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "recent", "reports"
  const [viewMode, setViewMode] = useState<"daily" | "classroom">("daily");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const { isAdmin, isTeacher, teacherId } = useTeacherStatus();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdParam = urlParams.get('studentId');
    if (studentIdParam) {
      setSelectedStudentId(studentIdParam);
    }
  }, []);

  useEffect(() => {
    if (isTeacher && teacherId) {
      setSelectedTeacherId(teacherId);
    }
  }, [isTeacher, teacherId]);

  const { data: teachers } = useQuery({
    queryKey: ['active-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('id, name').order('name', { ascending: true });
      if (error) { console.error("Error fetching teachers:", error); return []; }
      return data || [];
    }
  });
  
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['all-students-for-progress-book'], // Renamed queryKey
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('id, name, status').eq('status', 'active').order('name', { ascending: true });
      if (error) {
        console.error("Error fetching students:", error);
        toast({ title: "Error fetching students", description: "Could not retrieve student data.", variant: "destructive" });
        return [];
      }
      return data || [];
    },
    refetchInterval: 30000,
  });
  
  const currentTeacherId = isTeacher ? teacherId : (selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined));
  
  useRealtimeLeaderboard(currentTeacherId, () => {
    // Intentionally empty, realtime updates might trigger refetch of other queries if needed
  });
  
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
      <div className="space-y-4 sm:space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Progress Book</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Track student progress with Progress Book entries.
            </p>
          </div>
          <Button size="sm" className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
            <Book className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Export Records</span>
          </Button>
        </div>

        <TeacherStatsSection stats={{
          totalTeachers: teachers?.length || 0,
          totalStudents: students?.length || 0,
          subjectCount: 0,
          activeTeachers: 0,
          totalClasses: 0
        }} />

        <Card className="mt-4 sm:mt-6">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "daily" | "classroom")}>
              <div className="mb-3 sm:mb-4">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="daily" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2">
                    <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Daily Records</span>
                  </TabsTrigger>
                  <TabsTrigger value="classroom" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Classroom View</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="daily">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4">
                    <div className="overflow-x-auto pb-2 sm:pb-0">
                      <TabsList className="flex-nowrap w-full sm:w-auto">
                        <TabsTrigger value="all" className="text-xs whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5">All Students</TabsTrigger>
                        <TabsTrigger value="recent" className="text-xs whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5">Recent Entries</TabsTrigger>
                        <TabsTrigger value="reports" className="text-xs whitespace-nowrap px-2 sm:px-3 py-1 sm:py-1.5">Reports</TabsTrigger>
                      </TabsList>
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        className="pl-7 sm:pl-8 w-full sm:w-[200px] md:w-[250px] text-xs sm:text-sm h-8 sm:h-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <TabsContent value="all">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
                      <div className="md:col-span-1 space-y-3 sm:space-y-4">
                        <div>
                          <h3 className="mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Select Student</h3>
                          {studentsLoading ? (
                            <div className="flex items-center text-xs sm:text-sm text-muted-foreground p-2 border rounded-md bg-muted/30">
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" /> Loading...
                            </div>
                          ) : (
                            students && students.length > 0 ? (
                              <Select value={selectedStudentId || undefined} onValueChange={setSelectedStudentId}>
                                <SelectTrigger className="text-xs sm:text-sm h-9">
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
                            ) : (
                              <div className="flex items-center text-xs sm:text-sm text-muted-foreground space-x-1.5 border rounded-md p-2 bg-muted/30">
                                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>No active students.</span>
                              </div>
                            )
                          )}
                        </div>
                        
                        {isAdmin && (
                          <div>
                            <h3 className="mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Teacher</h3>
                            <Select
                              value={selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined)}
                              onValueChange={setSelectedTeacherId}
                            >
                              <SelectTrigger className="text-xs sm:text-sm h-9">
                                <SelectValue placeholder="All Teachers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" className="text-xs sm:text-sm">All Teachers</SelectItem>
                                {teachers?.map(teacher => (
                                  <SelectItem key={teacher.id} value={teacher.id} className="text-xs sm:text-sm">
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                                {(!teachers || teachers.length === 0) && (
                                  <SelectItem value="no-teachers" disabled className="text-xs sm:text-sm">No teachers found</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-3">
                        {selectedStudentId ? (
                          <DhorBookComponent 
                            studentId={selectedStudentId} 
                            teacherId={currentTeacherId || 'default'} 
                          />
                        ) : (
                          <div className="border rounded-lg flex flex-col items-center justify-center h-[200px] sm:h-[300px] bg-gray-50 dark:bg-gray-800/20 p-4 text-center">
                            <Book className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-gray-400 dark:text-gray-500" />
                            <h3 className="text-sm sm:text-base font-semibold mb-1 text-gray-700 dark:text-gray-300">No Student Selected</h3>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                              Please select a student from the list to view or add their Progress Book entries.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="recent">
                    <div className="p-4 border rounded-lg bg-muted/20 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Recent entries will be shown here.</p>
                      {/* Placeholder for recent entries content */}
                    </div>
                  </TabsContent>
                  <TabsContent value="reports">
                     <div className="p-4 border rounded-lg bg-muted/20 text-center">
                       <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                       <p className="text-sm text-muted-foreground">Progress reports will be generated here.</p>
                       {/* Placeholder for reports content */}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="classroom">
                {isAdmin && (
                  <div className="mb-3 sm:mb-4">
                    <h3 className="mb-1 sm:mb-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Select Teacher for Classroom View</h3>
                    <Select
                      value={selectedTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : undefined)}
                      onValueChange={setSelectedTeacherId}
                    >
                      <SelectTrigger className="text-xs sm:text-sm h-9">
                        <SelectValue placeholder="Choose a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="all" className="text-xs sm:text-sm">All Teachers</SelectItem>
                        {teachers?.map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id} className="text-xs sm:text-sm">
                            {teacher.name}
                          </SelectItem>
                        ))}
                         {(!teachers || teachers.length === 0) && (
                           <SelectItem value="no-teachers" disabled className="text-xs sm:text-sm">No teachers found</SelectItem>
                         )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <ClassroomRecords 
                  teacherId={currentTeacherId || (teachers && teachers.length > 0 ? teachers[0]?.id : 'default')}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
};

export default ProgressBookPage; 