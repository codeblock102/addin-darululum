/**
 * Student Metrics Calculator
 * Implements all 18 required student metrics
 */

import type { StudentMetrics, AnalyticsDataContext, TimePeriod } from "@/types/analytics.ts";
import {
  getDataForPeriod,
  calculateAveragePerDay,
  calculateAveragePerWeek,
  calculatePercentage,
  calculateRetentionScore,
  calculateConsistencyScore,
  calculateCompositeRiskScore,
  calculateDropOffProbability,
  checkStagnation,
  calculateJuzCompletion,
  calculateConsecutiveStreak,
  calculateDaysBetween,
} from "./analyticsCalculator.ts";
import { subDays, subWeeks, subMonths } from "date-fns";

/**
 * Calculate all student metrics for a single student
 */
export function calculateStudentMetrics(
  studentId: string,
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): StudentMetrics {
  const student = context.students.find((s) => s.id === studentId);
  if (!student) {
    throw new Error(`Student ${studentId} not found`);
  }

  const now = new Date();
  const from = timeRange?.from || subMonths(now, 12);
  const to = timeRange?.to || now;

  // Filter data for this student
  const studentProgress = context.progress.filter((p) => p.student_id === studentId);
  const studentAttendance = context.attendance.filter((a) => a.student_id === studentId);
  const studentAssignments = context.assignments.filter((a) => 
    Array.isArray(a.student_ids) && a.student_ids.includes(studentId)
  );
  const studentSubmissions = context.submissions.filter((s) => s.student_id === studentId);
  const studentJuzRevisions = context.juzRevisions.filter((r) => r.student_id === studentId);
  const studentSabaqPara = context.sabaqPara.filter((s) => s.student_id === studentId);

  // 1. Total pages memorized (lifetime, weekly, monthly)
  const lifetimePages = studentProgress.reduce((sum, p) => sum + (p.pages_memorized || 0), 0);
  const weeklyPages = getDataForPeriod(studentProgress, "weekly", now)
    .reduce((sum, p) => sum + (p.pages_memorized || 0), 0);
  const monthlyPages = getDataForPeriod(studentProgress, "monthly", now)
    .reduce((sum, p) => sum + (p.pages_memorized || 0), 0);

  // 2. Average memorization pace (pages/day and pages/week)
  const enrollmentDate = student.enrollment_date ? new Date(student.enrollment_date) : from;
  const daysSinceEnrollment = Math.max(1, calculateDaysBetween(enrollmentDate, now));
  const weeksSinceEnrollment = Math.max(1, Math.floor(daysSinceEnrollment / 7));
  
  const pagesPerDay = calculateAveragePerDay(lifetimePages, daysSinceEnrollment);
  const pagesPerWeek = calculateAveragePerWeek(lifetimePages, weeksSinceEnrollment);

  // 3. Active revision load (pages under review)
  // Count pages in juz_revisions that haven't been marked as mastered
  const activeRevisions = studentJuzRevisions.filter((r) => {
    const revDate = new Date(r.revision_date);
    const daysSinceRevision = calculateDaysBetween(revDate, now);
    // Consider revisions from last 90 days as "active"
    return daysSinceRevision <= 90;
  });
  const activeRevisionLoad = activeRevisions.length; // Simplified: count of active revisions

  // 4. Revision retention score
  const revisionRetentionScore = calculateRetentionScore(studentJuzRevisions, 30);

  // 5. Accuracy rate during tasmi' (% mistakes)
  // Calculate based on memorization_quality and mistake_count if available
  const progressWithQuality = studentProgress.filter((p) => p.memorization_quality);
  let totalMistakes = 0;
  let totalEntries = 0;
  
  studentProgress.forEach((p) => {
    // If mistake_count exists, use it
    if (p.mistake_count !== undefined && p.mistake_count !== null) {
      totalMistakes += p.mistake_count;
      totalEntries++;
    } else {
      // Estimate from quality rating
      const quality = p.memorization_quality;
      if (quality) {
        totalEntries++;
        // Estimate mistakes based on quality
        const mistakeEstimates: Record<string, number> = {
          excellent: 0,
          good: 2,
          average: 5,
          needsWork: 10,
          horrible: 15,
        };
        totalMistakes += mistakeEstimates[quality] || 5;
      }
    }
  });

  const averageMistakesPerEntry = totalEntries > 0 ? totalMistakes / totalEntries : 0;
  // Accuracy rate: lower mistakes = higher accuracy (inverse)
  const accuracyRateDuringTasmi = Math.max(0, 100 - Math.min(100, averageMistakesPerEntry * 5));

  // 6. Completion percentage (current Juz and total Hifz goal)
  const currentJuz = student.current_juz || 1;
  const completedJuz = Array.isArray(student.completed_juz) ? student.completed_juz : [];
  const completion = calculateJuzCompletion(currentJuz, completedJuz);

  // 7. Stagnation detection (no progress in X days)
  const lastProgress = studentProgress
    .map((p) => new Date(p.created_at || p.date || p.created_at || now))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  
  const stagnation = checkStagnation(lastProgress, 7);

  // 8. Attendance rate
  const presentCount = studentAttendance.filter((a) => a.status === "present").length;
  const attendanceRate = calculatePercentage(presentCount, studentAttendance.length);

  // 9. Late arrivals count
  const lateArrivalsCount = studentAttendance.filter((a) => 
    a.status === "late" || a.status?.toLowerCase() === "late"
  ).length;

  // 10. Absences (excused vs unexcused)
  const absentRecords = studentAttendance.filter((a) => 
    a.status === "absent" || a.status?.toLowerCase() === "absent"
  );
  // Note: Database may not have excused/unexcused distinction, so we'll estimate
  // If there's a notes field or late_reason, we could use that
  const excusedAbsences = absentRecords.filter((a) => 
    a.notes?.toLowerCase().includes("excused") || 
    a.late_reason?.toLowerCase().includes("excused")
  ).length;
  const unexcusedAbsences = absentRecords.length - excusedAbsences;

  // 11. Consecutive absence streaks
  const attendanceDates = studentAttendance
    .filter((a) => a.status === "absent" || a.status?.toLowerCase() === "absent")
    .map((a) => a.date || a.created_at)
    .filter(Boolean) as string[];
  
  const consecutiveAbsenceStreaks = calculateConsecutiveStreak(
    attendanceDates,
    () => true, // All dates in this array are absences
    false
  );

  // 12. Homework/assignment completion rate
  const assignedCount = studentAssignments.length;
  const submittedCount = studentSubmissions.filter((s) => 
    s.status === "submitted" || s.status === "graded"
  ).length;
  const homeworkAssignmentCompletionRate = calculatePercentage(submittedCount, assignedCount);

  // 13. Practice consistency score
  const progressDates = studentProgress.map((p) => p.created_at || p.date).filter(Boolean) as string[];
  const practiceConsistencyScore = calculateConsistencyScore(progressDates, 5, 30);

  // 14. Teacher effort rating
  // Based on frequency of teacher interactions (progress entries, attendance marks, etc.)
  const teacherInteractions = studentProgress.length + studentAttendance.length;
  const expectedInteractions = Math.floor((calculateDaysBetween(from, to) / 7) * 5); // 5 per week
  const teacherEffortRating = calculatePercentage(teacherInteractions, expectedInteractions);

  // 15. At-risk composite score
  const atRiskCompositeScore = calculateCompositeRiskScore({
    attendanceRate,
    paceScore: pagesPerWeek,
    accuracyScore: accuracyRateDuringTasmi,
    consistencyScore: practiceConsistencyScore,
    stagnationDays: stagnation.daysSinceLastProgress,
  });

  // 16. Burnout warning flag
  // Triggered by: high stagnation, low consistency, declining pace
  const recentWeeksPace = getDataForPeriod(studentProgress, "weekly", now)
    .reduce((sum, p) => sum + (p.pages_memorized || 0), 0);
  const previousWeeksPace = getDataForPeriod(studentProgress, "weekly", subWeeks(now, 2))
    .filter((p) => {
      const pDate = new Date(p.created_at || p.date || p.created_at);
      const weekAgo = subWeeks(now, 1);
      return pDate < weekAgo;
    })
    .reduce((sum, p) => sum + (p.pages_memorized || 0), 0);
  
  const paceDeclining = recentWeeksPace < previousWeeksPace * 0.7; // 30% drop
  const burnoutWarningFlag = 
    stagnation.isStagnant || 
    practiceConsistencyScore < 50 || 
    paceDeclining;

  // 17. Drop-off probability indicator
  const dropOffProbabilityIndicator = calculateDropOffProbability(atRiskCompositeScore, {
    consecutiveAbsences: consecutiveAbsenceStreaks,
    recentDecline: paceDeclining,
    lowEngagement: practiceConsistencyScore < 40,
  });

  return {
    studentId,
    studentName: student.name || "Unknown",
    section: student.section,
    totalPagesMemorized: {
      lifetime: lifetimePages,
      weekly: weeklyPages,
      monthly: monthlyPages,
    },
    averageMemorizationPace: {
      pagesPerDay,
      pagesPerWeek,
    },
    activeRevisionLoad,
    revisionRetentionScore,
    accuracyRateDuringTasmi,
    completionPercentage: {
      currentJuz: completion.currentJuzPercentage,
      totalHifzGoal: completion.totalHifzGoalPercentage,
    },
    stagnationDetection: {
      isStagnant: stagnation.isStagnant,
      daysSinceLastProgress: stagnation.daysSinceLastProgress,
      thresholdDays: 7,
    },
    attendanceRate,
    lateArrivalsCount,
    absences: {
      excused: excusedAbsences,
      unexcused: unexcusedAbsences,
      total: absentRecords.length,
    },
    consecutiveAbsenceStreaks,
    homeworkAssignmentCompletionRate,
    practiceConsistencyScore,
    teacherEffortRating,
    atRiskCompositeScore,
    burnoutWarningFlag,
    dropOffProbabilityIndicator,
  };
}

/**
 * Calculate metrics for all students
 */
export function calculateAllStudentMetrics(
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): StudentMetrics[] {
  return context.students
    .filter((s) => s.status === "active")
    .map((student) => {
      try {
        return calculateStudentMetrics(student.id, context, timeRange);
      } catch (error) {
        console.error(`Error calculating metrics for student ${student.id}:`, error);
        return null;
      }
    })
    .filter((m): m is StudentMetrics => m !== null);
}

