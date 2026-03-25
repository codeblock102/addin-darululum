/**
 * Teacher Student Metrics Hook
 *
 * Fetches the teacher's own students and computes live per-student metrics:
 * - Attendance rate (last 30 days)
 * - Memorization pace (pages/week)
 * - Days since last progress entry
 * - At-risk flag: attendance <70% OR no progress in 14+ days
 * - Stagnation flag: no progress in 7+ days
 *
 * Used by the teacher portal "My Students" and "Performance" views.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { subDays } from "date-fns";

export interface TeacherStudentMetric {
  id: string;
  name: string;
  section: string | null;
  currentJuz: number | null;
  completedJuz: number;
  attendanceRate: number | null;    // % present in last 30 days (null = no records)
  pacePerWeek: number;              // avg pages/week last 30 days
  daysSinceProgress: number;        // 999 = never recorded
  totalPagesLast30Days: number;
  isAtRisk: boolean;                // attendance <70% OR no progress in 14+ days
  isStagnant: boolean;              // no progress in 7+ days
}

export interface TeacherStudentMetricsSummary {
  students: TeacherStudentMetric[];
  atRiskCount: number;
  stagnantCount: number;
  avgAttendanceRate: number;
  avgPacePerWeek: number;
}

export function useTeacherStudentMetrics(teacherId: string) {
  return useQuery<TeacherStudentMetricsSummary>({
    queryKey: ["teacher-student-metrics", teacherId],
    enabled: !!teacherId && teacherId !== "admin-view",
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<TeacherStudentMetricsSummary> => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split("T")[0];

      // Step 1: Get student names assigned to this teacher
      const { data: assignments } = await supabase
        .from("students_teachers")
        .select("student_name")
        .eq("teacher_id", teacherId)
        .eq("active", true);

      const assignedNames = (assignments || []).map((a) => a.student_name);

      if (assignedNames.length === 0) {
        return {
          students: [],
          atRiskCount: 0,
          stagnantCount: 0,
          avgAttendanceRate: 0,
          avgPacePerWeek: 0,
        };
      }

      // Step 2: Fetch student records, attendance, and progress in parallel
      const [studentsResult, attendanceResult, progressResult] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, section, current_juz, completed_juz, status")
          .in("name", assignedNames)
          .eq("status", "active"),
        supabase
          .from("attendance")
          .select("student_id, date, status")
          .gte("date", thirtyDaysAgoDate),
        supabase
          .from("progress")
          .select("student_id, created_at, pages_memorized")
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      const dbStudents = studentsResult.data || [];
      const attendanceRecords = attendanceResult.data || [];
      const progressRecords = progressResult.data || [];

      // Step 3: Compute per-student metrics
      const studentMetrics: TeacherStudentMetric[] = dbStudents.map((student) => {
        const studentAttendance = attendanceRecords.filter(
          (a) => a.student_id === student.id
        );
        const studentProgress = progressRecords.filter(
          (p) => p.student_id === student.id
        );

        // Attendance rate
        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : null;

        // Memorization pace (pages/week over 4.3 weeks)
        const totalPages = studentProgress.reduce(
          (sum, p) => sum + (p.pages_memorized || 0),
          0
        );
        const pacePerWeek = parseFloat((totalPages / 4.3).toFixed(2));

        // Days since last progress
        const sorted = [...studentProgress].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastEntry = sorted[0];
        const daysSinceProgress = lastEntry
          ? Math.floor(
              (now.getTime() - new Date(lastEntry.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 999;

        const isAtRisk =
          (attendanceRate !== null && attendanceRate < 70) ||
          daysSinceProgress >= 14;
        const isStagnant = daysSinceProgress >= 7;

        return {
          id: student.id,
          name: student.name,
          section: student.section,
          currentJuz: student.current_juz,
          completedJuz: (student.completed_juz || []).length,
          attendanceRate,
          pacePerWeek,
          daysSinceProgress,
          totalPagesLast30Days: totalPages,
          isAtRisk,
          isStagnant,
        };
      });

      // Sort: at-risk first, then stagnant, then by lowest attendance
      studentMetrics.sort((a, b) => {
        if (a.isAtRisk !== b.isAtRisk) return a.isAtRisk ? -1 : 1;
        if (a.isStagnant !== b.isStagnant) return a.isStagnant ? -1 : 1;
        return (a.attendanceRate ?? 100) - (b.attendanceRate ?? 100);
      });

      // Summary stats
      const atRiskCount = studentMetrics.filter((s) => s.isAtRisk).length;
      const stagnantCount = studentMetrics.filter((s) => s.isStagnant).length;

      const withAttendance = studentMetrics.filter((s) => s.attendanceRate !== null);
      const avgAttendanceRate =
        withAttendance.length > 0
          ? parseFloat(
              (
                withAttendance.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) /
                withAttendance.length
              ).toFixed(1)
            )
          : 0;

      const withPace = studentMetrics.filter((s) => s.pacePerWeek > 0);
      const avgPacePerWeek =
        withPace.length > 0
          ? parseFloat(
              (
                withPace.reduce((sum, s) => sum + s.pacePerWeek, 0) / withPace.length
              ).toFixed(2)
            )
          : 0;

      return {
        students: studentMetrics,
        atRiskCount,
        stagnantCount,
        avgAttendanceRate,
        avgPacePerWeek,
      };
    },
  });
}
