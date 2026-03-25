/**
 * Live Analytics Hook
 * Computes analytics directly from source tables - no pre-aggregation required.
 * This is the primary data source for the analytics dashboard.
 *
 * Metrics computed:
 * - Active student count and attendance rates (last 30 days)
 * - Memorization pace (pages/week per student, last 30 days)
 * - At-risk identification: attendance < 70% OR no progress in 14 days
 * - Stagnation: no progress in 7 days
 * - Teacher effectiveness: avg pace and at-risk count per teacher
 * - Class capacity utilization
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { subDays } from "date-fns";

export interface StudentLiveMetrics {
  id: string;
  name: string;
  section: string | null;
  currentJuz: number | null;
  completedJuz: number;
  attendanceRate: number | null;    // % present in last 30 days (null = no records)
  pacePerWeek: number;              // avg pages/week in last 30 days
  daysSinceProgress: number;        // days since last progress entry (999 = never)
  totalPagesLast30Days: number;
  isAtRisk: boolean;                // attendance < 70% OR no progress in 14+ days
  isStagnant: boolean;              // no progress in 7+ days
}

export interface TeacherLiveMetrics {
  id: string;
  name: string | null;
  studentCount: number;
  avgAttendanceRate: number | null;
  avgPacePerWeek: number;
  atRiskCount: number;
}

export interface ClassLiveMetrics {
  id: string;
  name: string;
  capacity: number;
  currentStudents: number;
  capacityUtilization: number;      // percentage
  attendanceRate: number | null;    // % present from attendance records
}

export interface AnalyticsLiveOverview {
  totalActiveStudents: number;
  totalActiveTeachers: number;
  overallAttendanceRate: number;
  avgMemorizationVelocity: number;  // pages/week
  atRiskCount: number;
  atRiskPercentage: number;
  studentsOnTrackCount: number;
  studentsOnTrackPercentage: number;
  stagnantCount: number;
  computedAt: string;
}

export interface AnalyticsLiveData {
  overview: AnalyticsLiveOverview;
  students: StudentLiveMetrics[];
  teachers: TeacherLiveMetrics[];
  classes: ClassLiveMetrics[];
}

export function useAnalyticsLive() {
  return useQuery<AnalyticsLiveData>({
    queryKey: ["analytics-live"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split("T")[0];

      // Fetch all required data in parallel
      const [
        studentsResult,
        teachersResult,
        classesResult,
        attendanceResult,
        progressResult,
        studentsTeachersResult,
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id, name, section, status, current_juz, completed_juz")
          .eq("status", "active"),
        supabase
          .from("profiles")
          .select("id, name, role")
          .eq("role", "teacher"),
        supabase
          .from("classes")
          .select("id, name, capacity, current_students, status, teacher_id, teacher_ids"),
        supabase
          .from("attendance")
          .select("student_id, class_id, date, status")
          .gte("date", thirtyDaysAgoDate),
        supabase
          .from("progress")
          .select("student_id, created_at, pages_memorized, memorization_quality")
          .gte("created_at", thirtyDaysAgo.toISOString()),
        supabase
          .from("students_teachers")
          .select("teacher_id, student_name, id")
          .eq("active", true),
      ]);

      const activeStudents = studentsResult.data || [];
      const allTeachers = teachersResult.data || [];
      const allClasses = classesResult.data || [];
      const attendanceRecords = attendanceResult.data || [];
      const progressRecords = progressResult.data || [];
      const studentsTeachers = studentsTeachersResult.data || [];

      // ─── Per-student metrics ───────────────────────────────────────────────
      const studentMetrics: StudentLiveMetrics[] = activeStudents.map((student) => {
        const studentAttendance = attendanceRecords.filter(
          (a) => a.student_id === student.id
        );
        const studentProgress = progressRecords.filter(
          (p) => p.student_id === student.id
        );

        // Attendance rate over last 30 days
        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : null;

        // Pages memorized in last 30 days → pace per week (30 days ≈ 4.3 weeks)
        const totalPages = studentProgress.reduce(
          (sum, p) => sum + (p.pages_memorized || 0),
          0
        );
        const pacePerWeek = parseFloat((totalPages / 4.3).toFixed(2));

        // Days since most recent progress entry
        const sortedProgress = [...studentProgress].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const lastProgress = sortedProgress[0];
        const daysSinceProgress = lastProgress
          ? Math.floor(
              (now.getTime() - new Date(lastProgress.created_at).getTime()) /
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

      // Sort: at-risk first, then by lowest attendance rate
      const sortedStudents = [...studentMetrics].sort((a, b) => {
        if (a.isAtRisk !== b.isAtRisk) return a.isAtRisk ? -1 : 1;
        return (a.attendanceRate ?? 100) - (b.attendanceRate ?? 100);
      });

      // ─── Overview metrics ──────────────────────────────────────────────────
      const totalActiveStudents = activeStudents.length;
      const atRiskCount = studentMetrics.filter((s) => s.isAtRisk).length;
      const atRiskPercentage =
        totalActiveStudents > 0 ? (atRiskCount / totalActiveStudents) * 100 : 0;

      const studentsWithAttendance = studentMetrics.filter(
        (s) => s.attendanceRate !== null
      );
      const overallAttendanceRate =
        studentsWithAttendance.length > 0
          ? studentsWithAttendance.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) /
            studentsWithAttendance.length
          : 0;

      const studentsWithProgress = studentMetrics.filter((s) => s.pacePerWeek > 0);
      const avgMemorizationVelocity =
        studentsWithProgress.length > 0
          ? studentsWithProgress.reduce((sum, s) => sum + s.pacePerWeek, 0) /
            studentsWithProgress.length
          : 0;

      // On track: attendance ≥ 80% (or no records yet) AND progress within last 7 days
      const studentsOnTrack = studentMetrics.filter(
        (s) =>
          (s.attendanceRate === null || s.attendanceRate >= 80) &&
          s.daysSinceProgress < 7
      );
      const studentsOnTrackPercentage =
        totalActiveStudents > 0
          ? (studentsOnTrack.length / totalActiveStudents) * 100
          : 0;

      // ─── Per-teacher metrics ───────────────────────────────────────────────
      // Build a lookup: teacher_id → Set<student_id> via classes (primary)
      const teacherStudentIdMap: Record<string, Set<string>> = {};
      for (const cls of allClasses) {
        const teacherIdList: string[] = Array.isArray((cls as any).teacher_ids)
          ? (cls as any).teacher_ids
          : (cls as any).teacher_id
          ? [(cls as any).teacher_id]
          : [];
        const studentIdList: string[] = Array.isArray(cls.current_students)
          ? (cls.current_students as unknown as string[])
          : [];
        for (const tid of teacherIdList) {
          if (!teacherStudentIdMap[tid]) teacherStudentIdMap[tid] = new Set();
          for (const sid of studentIdList) teacherStudentIdMap[tid].add(sid);
        }
      }

      // Fallback: also add from students_teachers table (by name matching)
      const studentById: Record<string, StudentLiveMetrics> = {};
      for (const s of studentMetrics) studentById[s.id] = s;
      const studentByName: Record<string, StudentLiveMetrics> = {};
      for (const s of studentMetrics) studentByName[s.name] = s;

      for (const st of studentsTeachers) {
        const matched = studentByName[st.student_name];
        if (matched) {
          if (!teacherStudentIdMap[st.teacher_id]) teacherStudentIdMap[st.teacher_id] = new Set();
          teacherStudentIdMap[st.teacher_id].add(matched.id);
        }
      }

      const teacherMetrics: TeacherLiveMetrics[] = allTeachers.map((teacher) => {
        const assignedIds = Array.from(teacherStudentIdMap[teacher.id] || new Set<string>());
        const assignedStudents = assignedIds
          .map((id) => studentById[id])
          .filter(Boolean);

        const studentsWithAtt = assignedStudents.filter((s) => s.attendanceRate !== null);
        const avgAttendanceRate =
          studentsWithAtt.length > 0
            ? studentsWithAtt.reduce((sum, s) => sum + (s.attendanceRate ?? 0), 0) /
              studentsWithAtt.length
            : null;

        const avgPacePerWeek =
          assignedStudents.length > 0
            ? parseFloat(
                (
                  assignedStudents.reduce((sum, s) => sum + s.pacePerWeek, 0) /
                  assignedStudents.length
                ).toFixed(2)
              )
            : 0;

        return {
          id: teacher.id,
          name: teacher.name,
          studentCount: assignedStudents.length,
          avgAttendanceRate,
          avgPacePerWeek,
          atRiskCount: assignedStudents.filter((s) => s.isAtRisk).length,
        };
      });

      // Sort teachers: most at-risk students first
      teacherMetrics.sort((a, b) => b.atRiskCount - a.atRiskCount);

      // ─── Per-class metrics ─────────────────────────────────────────────────
      const classMetrics: ClassLiveMetrics[] = allClasses.map((cls) => {
        // current_students is a string[] of UUIDs — use .length for count
        const currentStudents = Array.isArray(cls.current_students)
          ? (cls.current_students as unknown as string[]).length
          : typeof cls.current_students === "number"
          ? cls.current_students
          : 0;
        const capacityUtilization =
          cls.capacity > 0
            ? parseFloat(((currentStudents / cls.capacity) * 100).toFixed(1))
            : 0;

        // Attendance: first try by class_id, then fall back to student membership
        let classAttendance = attendanceRecords.filter((a) => a.class_id === cls.id);
        if (classAttendance.length === 0 && Array.isArray(cls.current_students) && (cls.current_students as unknown as string[]).length > 0) {
          const memberIds = new Set(cls.current_students as unknown as string[]);
          classAttendance = attendanceRecords.filter((a) => memberIds.has(a.student_id));
        }
        const classPresent = classAttendance.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
        const classAttendanceRate =
          classAttendance.length > 0
            ? parseFloat(((classPresent / classAttendance.length) * 100).toFixed(1))
            : null;

        return {
          id: cls.id,
          name: cls.name,
          capacity: cls.capacity,
          currentStudents,
          capacityUtilization,
          attendanceRate: classAttendanceRate,
        };
      });

      return {
        overview: {
          totalActiveStudents,
          totalActiveTeachers: allTeachers.length,
          overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(1)),
          avgMemorizationVelocity: parseFloat(avgMemorizationVelocity.toFixed(2)),
          atRiskCount,
          atRiskPercentage: parseFloat(atRiskPercentage.toFixed(1)),
          studentsOnTrackCount: studentsOnTrack.length,
          studentsOnTrackPercentage: parseFloat(studentsOnTrackPercentage.toFixed(1)),
          stagnantCount: studentMetrics.filter((s) => s.isStagnant).length,
          computedAt: now.toISOString(),
        },
        students: sortedStudents,
        teachers: teacherMetrics,
        classes: classMetrics,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
