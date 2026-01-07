/**
 * Program Metrics Calculator
 * Implements all 9 required program-level metrics
 */

import type { ProgramMetrics, AnalyticsDataContext } from "@/types/analytics.ts";
import { calculatePercentage, calculateAveragePerWeek } from "./analyticsCalculator.ts";
import { calculateAllStudentMetrics } from "./studentMetrics.ts";
import { calculateAllTeacherMetrics } from "./teacherMetrics.ts";
import { subMonths, startOfMonth } from "date-fns";

/**
 * Calculate all program-level metrics
 */
export function calculateProgramMetrics(
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): ProgramMetrics {
  const now = new Date();
  const from = timeRange?.from || subMonths(now, 12);
  const to = timeRange?.to || now;

  // Calculate all student and teacher metrics
  const allStudentMetrics = calculateAllStudentMetrics(context, timeRange);
  const allTeacherMetrics = calculateAllTeacherMetrics(context, timeRange);

  // 1. Overall memorization velocity
  const totalPagesAllStudents = allStudentMetrics.reduce((sum, m) => 
    sum + m.totalPagesMemorized.lifetime, 0
  );
  const weeksInPeriod = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 7)) || 1;
  const overallMemorizationVelocity = calculateAveragePerWeek(totalPagesAllStudents, weeksInPeriod);

  // 2. % students on track vs behind
  // Assume target is 5 pages per week
  const weeklyTarget = 5;
  const studentsOnTrack = allStudentMetrics.filter((m) => 
    m.averageMemorizationPace.pagesPerWeek >= weeklyTarget
  ).length;
  const studentsBehind = allStudentMetrics.length - studentsOnTrack;
  const percentageStudentsOnTrack = calculatePercentage(studentsOnTrack, allStudentMetrics.length || 1);
  const percentageStudentsBehind = calculatePercentage(studentsBehind, allStudentMetrics.length || 1);

  // 3. Average institutional accuracy rate
  const totalAccuracy = allStudentMetrics.reduce((sum, m) => 
    sum + m.accuracyRateDuringTasmi, 0
  );
  const averageInstitutionalAccuracyRate = allStudentMetrics.length > 0
    ? Math.round((totalAccuracy / allStudentMetrics.length) * 100) / 100
    : 0;

  // 4. Monthly student retention
  const monthStart = startOfMonth(subMonths(now, 1));
  const studentsAtMonthStart = context.students.filter((s) => {
    const enrollmentDate = s.enrollment_date ? new Date(s.enrollment_date) : null;
    return enrollmentDate && enrollmentDate <= monthStart;
  }).length;
  
  const activeStudentsNow = context.students.filter((s) => s.status === "active").length;
  const monthlyStudentRetention = calculatePercentage(activeStudentsNow, studentsAtMonthStart || 1);

  // 5. Enrollments vs withdrawals
  const enrollmentPeriod = { from: subMonths(now, 1), to: now };
  const enrollments = context.students.filter((s) => {
    const enrollmentDate = s.enrollment_date ? new Date(s.enrollment_date) : null;
    return enrollmentDate && enrollmentDate >= enrollmentPeriod.from && enrollmentDate <= enrollmentPeriod.to;
  }).length;

  const withdrawals = context.students.filter((s) => {
    if (s.status !== "inactive") return false;
    const statusStartDate = s.status_start_date ? new Date(s.status_start_date) : null;
    return statusStartDate && statusStartDate >= enrollmentPeriod.from && statusStartDate <= enrollmentPeriod.to;
  }).length;

  // 6. Average student lifetime
  const studentLifetimes = context.students
    .filter((s) => s.enrollment_date)
    .map((s) => {
      const enrollmentDate = new Date(s.enrollment_date!);
      const endDate = s.status === "inactive" && s.status_start_date 
        ? new Date(s.status_start_date)
        : now;
      return Math.max(0, (endDate.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
    });
  
  const averageStudentLifetime = studentLifetimes.length > 0
    ? Math.round((studentLifetimes.reduce((a, b) => a + b, 0) / studentLifetimes.length) * 100) / 100
    : 0;

  // 7. Teacher turnover rate
  const allTeachers = context.teachers.filter((t) => t.role === "teacher");
  // Estimate: teachers who haven't had activity in last 90 days might be considered "turned over"
  const activeTeachers = allTeacherMetrics.filter((m) => 
    m.sessionsConductedVsScheduled.conducted > 0
  ).length;
  const teacherTurnoverRate = calculatePercentage(
    allTeachers.length - activeTeachers,
    allTeachers.length || 1
  );

  // 8. Teacher utilization rate
  // Calculate based on active hours vs available hours (assume 40 hours/week available)
  const totalActiveHours = allTeacherMetrics.reduce((sum, m) => 
    sum + m.activeTeachingHoursPerWeek, 0
  );
  const totalAvailableHours = allTeachers.length * 40; // 40 hours/week per teacher
  const teacherUtilizationRate = calculatePercentage(totalActiveHours, totalAvailableHours || 1);

  // 9. Sessions delivered vs planned
  const totalDelivered = allTeacherMetrics.reduce((sum, m) => 
    sum + m.sessionsConductedVsScheduled.conducted, 0
  );
  const totalPlanned = allTeacherMetrics.reduce((sum, m) => 
    sum + m.sessionsConductedVsScheduled.scheduled, 0
  );
  const sessionsRatio = calculatePercentage(totalDelivered, totalPlanned || 1);

  return {
    overallMemorizationVelocity: Math.round(overallMemorizationVelocity * 100) / 100,
    percentageStudentsOnTrackVsBehind: {
      onTrack: percentageStudentsOnTrack,
      behind: percentageStudentsBehind,
    },
    averageInstitutionalAccuracyRate,
    monthlyStudentRetention,
    enrollmentsVsWithdrawals: {
      enrollments,
      withdrawals,
      netChange: enrollments - withdrawals,
    },
    averageStudentLifetime,
    teacherTurnoverRate,
    teacherUtilizationRate,
    sessionsDeliveredVsPlanned: {
      delivered: totalDelivered,
      planned: totalPlanned,
      ratio: sessionsRatio,
    },
  };
}

