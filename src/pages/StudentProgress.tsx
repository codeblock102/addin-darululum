import { useState } from "react";
import { Card } from "@/components/ui/card.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { StudentSearch } from "@/components/student-progress/StudentSearch.tsx";
import { ProgressOverview } from "@/components/student-progress/ProgressOverview.tsx";
import { ProgressCharts } from "@/components/student-progress/ProgressCharts.tsx";
import { AttendanceStats } from "@/components/student-progress/AttendanceStats.tsx";
import { ExportOptions } from "@/components/student-progress/ExportOptions.tsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Loader2, School2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types.ts";
import { Progress } from "@/types/progress.ts";
import { DailyActivityEntry } from "@/types/dhor-book.ts";
import { AttendanceRecord as Attendance } from "@/types/attendance.ts";

/**
 * @file StudentProgressPage.tsx
 * @description This file defines the `StudentProgressPage` component, which serves as a comprehensive dashboard for tracking an individual student's academic progress.
 * It allows users to search for a student and then displays various metrics including overall progress, sabaq (new lesson) and para (chapter) progression, juz (part of Quran) revisions, and attendance.
 * Data is fetched from a Supabase backend using Tanstack Query for asynchronous operations and state management.
 * The page includes visual components like charts for progress and stats for attendance, along with options to export student data.
 * It handles loading states and displays a message prompting the user to select a student if none is chosen.
 */

/**
 * @function StudentProgressPage
 * @description The main component for the student progress tracking page.
 * It manages the state for the selected student and fetches their detailed progress data including academic achievements and attendance.
 * It renders various sub-components to display this information in an organized manner.
 * @returns {JSX.Element} The rendered student progress page.
 */
const StudentProgressPage = () => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const { toast } = useToast();

  const { isLoading: studentLoading } = useQuery({
    queryKey: ["student-details", selectedStudentId],
    /**
     * @function queryFn (for student details)
     * @description Fetches basic details for the selected student from the Supabase 'students' table.
     * @async
     * @throws {Error} If there is an error during data fetching.
     * @returns {Promise<Tables<"students"> | null>} A promise that resolves to the student's data object or null if no student is selected.
     */
    queryFn: async () => {
      if (!selectedStudentId) return null;

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", selectedStudentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudentId,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<
    Progress[]
  >({
    queryKey: ["student-progress-data", selectedStudentId],
    /**
     * @function queryFn (for student progress data)
     * @description Fetches all progress entries for the selected student from the Supabase 'progress' table, including the student's name via a join.
     * Entries are ordered by date.
     * @async
     * @throws {Error} If there is an error during data fetching.
     * @returns {Promise<Progress[]>} A promise that resolves to an array of progress entries.
     */
    queryFn: async () => {
      if (!selectedStudentId) return [];

      const { data, error } = await supabase
        .from("progress")
        .select(`
          *,
          students(name)
        `)
        .eq("student_id", selectedStudentId)
        .order("entry_date", { ascending: true });

      if (error) throw error;
      return data as unknown as Progress[] || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery<
    Tables<"attendance">[]
  >({
    queryKey: ["student-attendance", selectedStudentId],
    /**
     * @function queryFn (for student attendance data)
     * @description Fetches all attendance records for the selected student from the Supabase 'attendance' table.
     * Records are ordered by date.
     * @async
     * @throws {Error} If there is an error during data fetching.
     * @returns {Promise<Tables<"attendance">[]>} A promise that resolves to an array of attendance records.
     */
    queryFn: async () => {
      if (!selectedStudentId) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: sabaqParaData, isLoading: sabaqParaLoading } = useQuery<
    Tables<"sabaq_para">[]
  >({
    queryKey: ["student-sabaq-para-data", selectedStudentId],
    /**
     * @function queryFn (for student sabaq/para data)
     * @description Fetches sabaq (new lesson) and para (chapter) progression data for the selected student from the Supabase 'sabaq_para' table.
     * Data is ordered by revision date.
     * @async
     * @throws {Error} If there is an error during data fetching.
     * @returns {Promise<Tables<"sabaq_para">[]>} A promise that resolves to an array of sabaq/para progression records.
     */
    queryFn: async () => {
      if (!selectedStudentId) return [];

      const { data, error } = await supabase
        .from("sabaq_para")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("revision_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: juzRevisionsData, isLoading: juzRevisionsLoading } = useQuery<
    Tables<"juz_revisions">[]
  >({
    queryKey: ["student-juz-revisions-data", selectedStudentId],
    /**
     * @function queryFn (for student juz revisions data)
     * @description Fetches juz (part of Quran) revision data for the selected student from the Supabase 'juz_revisions' table.
     * Data is ordered by revision date.
     * @async
     * @throws {Error} If there is an error during data fetching.
     * @returns {Promise<Tables<"juz_revisions">[]>} A promise that resolves to an array of juz revision records.
     */
    queryFn: async () => {
      if (!selectedStudentId) return [];

      const { data, error } = await supabase
        .from("juz_revisions")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("revision_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const isLoading = studentLoading || progressLoading || attendanceLoading ||
    sabaqParaLoading || juzRevisionsLoading;

  /**
   * @function handleStudentSelect
   * @description Callback function triggered when a student is selected from the `StudentSearch` component.
   * Updates the state with the selected student's ID and name.
   * @param {string} studentId - The ID of the selected student.
   * @param {string} studentName - The name of the selected student.
   * @returns {void}
   */
  const handleStudentSelect = (studentId: string, studentName: string) => {
    setSelectedStudentId(studentId);
    setSelectedStudentName(studentName);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Student Progress Tracker
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Comprehensive view of student performance and progress
          </p>
        </div>
      </div>

      <StudentSearch onStudentSelect={handleStudentSelect} />

      {selectedStudentId
        ? (
          isLoading
            ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )
            : (
              <div className="space-y-6 animate-fade-in">
                <ProgressOverview
                  studentName={selectedStudentName}
                  progressData={progressData as DailyActivityEntry[] || []}
                  sabaqParaData={sabaqParaData || []}
                  juzRevisionsData={juzRevisionsData || []}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ProgressCharts
                      progressData={progressData as DailyActivityEntry[] || []}
                      sabaqParaData={sabaqParaData || []}
                      juzRevisionsData={juzRevisionsData || []}
                    />
                  </div>
                  <div>
                    <AttendanceStats
                      attendanceData={attendanceData as Attendance[] || []}
                    />
                  </div>
                </div>

                <ExportOptions
                  studentId={selectedStudentId}
                  studentName={selectedStudentName}
                  progressData={progressData as DailyActivityEntry[] || []}
                  attendanceData={attendanceData as Attendance[] || []}
                  sabaqParaData={sabaqParaData || []}
                  juzRevisionsData={juzRevisionsData || []}
                  toast={toast}
                />
              </div>
            )
        )
        : (
          <Card className="p-12 text-center border-dashed bg-muted/40">
            <div className="flex flex-col items-center gap-3">
              <School2 className="h-12 w-12 text-muted-foreground/60" />
              <h3 className="text-xl font-medium">No Student Selected</h3>
              <p className="text-muted-foreground max-w-md">
                Search and select a student above to view their progress
                details, attendance history, and more.
              </p>
            </div>
          </Card>
        )}
    </div>
  );
};

export default StudentProgressPage;
