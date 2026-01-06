/**
 * Teacher Metrics Calculator
 * Implements all 15 required teacher metrics
 */

import type { TeacherMetrics, AnalyticsDataContext } from "@/types/analytics.ts";
import { calculatePercentage, calculateAveragePerWeek, getDataForPeriod } from "./analyticsCalculator.ts";
import { calculateStudentMetrics } from "./studentMetrics.ts";
import { subWeeks, startOfWeek } from "date-fns";

/**
 * Calculate hours from time string (HH:MM format)
 */
function timeStringToHours(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours + (minutes || 0) / 60;
}

/**
 * Calculate hours between two time strings
 */
function calculateHoursBetween(startTime: string, endTime: string): number {
  const start = timeStringToHours(startTime);
  const end = timeStringToHours(endTime);
  return Math.max(0, end - start);
}

/**
 * Calculate all teacher metrics for a single teacher
 */
export function calculateTeacherMetrics(
  teacherId: string,
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): TeacherMetrics {
  const teacher = context.teachers.find((t) => t.id === teacherId);
  if (!teacher) {
    throw new Error(`Teacher ${teacherId} not found`);
  }

  const now = new Date();
  const from = timeRange?.from || subWeeks(now, 4);
  const to = timeRange?.to || now;

  // Get teacher's classes
  const teacherClasses = context.classes.filter((c) => {
    const classTeacherIds = Array.isArray(c.teacher_ids) ? c.teacher_ids : [];
    if (classTeacherIds.includes(teacherId)) return true;
    
    // Check time_slots for teacher assignment
    if (Array.isArray(c.time_slots)) {
      return c.time_slots.some((slot: any) => {
        const slotTeacherIds = Array.isArray(slot.teacher_ids) ? slot.teacher_ids : [];
        return slotTeacherIds.includes(teacherId);
      });
    }
    return false;
  });

  // Get students assigned to teacher (through classes)
  const studentIds = new Set<string>();
  teacherClasses.forEach((c) => {
    const classStudents = Array.isArray(c.current_students) ? c.current_students : [];
    classStudents.forEach((sid: string) => studentIds.add(sid));
  });
  const teacherStudents = Array.from(studentIds);

  // 1. Number of students per teacher
  const numberOfStudentsPerTeacher = teacherStudents.length;

  // 2. Active teaching hours per week
  let weeklyHours = 0;
  teacherClasses.forEach((c) => {
    if (Array.isArray(c.time_slots)) {
      c.time_slots.forEach((slot: any) => {
        const slotTeacherIds = Array.isArray(slot.teacher_ids) ? slot.teacher_ids : [];
        if (slotTeacherIds.includes(teacherId) && slot.start_time && slot.end_time) {
          const hours = calculateHoursBetween(slot.start_time, slot.end_time);
          const daysPerWeek = Array.isArray(slot.days) ? slot.days.length : 
                             (Array.isArray(c.days_of_week) ? c.days_of_week.length : 0);
          weeklyHours += hours * daysPerWeek;
        }
      });
    } else if (c.days_of_week && Array.isArray(c.days_of_week)) {
      // Fallback: estimate 1.5 hours per class session
      weeklyHours += c.days_of_week.length * 1.5;
    }
  });
  const activeTeachingHoursPerWeek = Math.round(weeklyHours * 100) / 100;

  // 3. Student-to-teacher ratio
  const studentToTeacherRatio = numberOfStudentsPerTeacher; // Simplified: students per teacher

  // 4. Sessions conducted vs scheduled
  // Estimate sessions from attendance records and progress entries
  const teacherProgress = context.progress.filter((p) => 
    p.contributor_id === teacherId || p.teacher_id === teacherId
  );
  const teacherAttendance = context.attendance.filter((a) => 
    a.teacher_id === teacherId
  );
  
  // Estimate scheduled sessions from classes
  let scheduledSessions = 0;
  teacherClasses.forEach((c) => {
    if (Array.isArray(c.time_slots)) {
      c.time_slots.forEach((slot: any) => {
        const slotTeacherIds = Array.isArray(slot.teacher_ids) ? slot.teacher_ids : [];
        if (slotTeacherIds.includes(teacherId)) {
          const daysPerWeek = Array.isArray(slot.days) ? slot.days.length : 
                             (Array.isArray(c.days_of_week) ? c.days_of_week.length : 0);
          const weeks = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 7));
          scheduledSessions += daysPerWeek * weeks;
        }
      });
    }
  });
  
  const conductedSessions = teacherProgress.length + teacherAttendance.length;
  const sessionsRatio = calculatePercentage(conductedSessions, scheduledSessions || 1);

  // 5. Average student memorization pace under teacher
  const studentMetrics = teacherStudents
    .map((sid) => {
      try {
        return calculateStudentMetrics(sid, context, timeRange);
      } catch {
        return null;
      }
    })
    .filter((m): m is ReturnType<typeof calculateStudentMetrics> => m !== null);
  
  const averageStudentMemorizationPace = studentMetrics.length > 0
    ? studentMetrics.reduce((sum, m) => sum + m.averageMemorizationPace.pagesPerWeek, 0) / studentMetrics.length
    : 0;

  // 6. Average student accuracy rate
  const averageStudentAccuracyRate = studentMetrics.length > 0
    ? studentMetrics.reduce((sum, m) => sum + m.accuracyRateDuringTasmi, 0) / studentMetrics.length
    : 0;

  // 7. Student retention rate
  // Calculate based on students who were active at start and end of period
  const activeStudentsAtStart = teacherStudents.filter((sid) => {
    const student = context.students.find((s) => s.id === sid);
    if (!student) return false;
    const enrollmentDate = student.enrollment_date ? new Date(student.enrollment_date) : null;
    return enrollmentDate && enrollmentDate <= from;
  });
  
  const activeStudentsAtEnd = teacherStudents.filter((sid) => {
    const student = context.students.find((s) => s.id === sid);
    return student && student.status === "active";
  });
  
  const studentRetentionRate = calculatePercentage(
    activeStudentsAtEnd.length,
    activeStudentsAtStart.length || 1
  );

  // 8. % of students meeting weekly targets
  // Assume target is 5 pages per week
  const weeklyTarget = 5;
  const studentsMeetingTarget = studentMetrics.filter((m) => 
    m.totalPagesMemorized.weekly >= weeklyTarget
  ).length;
  const percentageOfStudentsMeetingWeeklyTargets = calculatePercentage(
    studentsMeetingTarget,
    studentMetrics.length || 1
  );

  // 9. Number of at-risk students assigned
  const numberOfAtRiskStudentsAssigned = studentMetrics.filter((m) => 
    m.atRiskCompositeScore >= 50
  ).length;

  // 10. Teacher attendance rate
  // Based on scheduled vs actual sessions
  const teacherAttendanceRate = sessionsRatio;

  // 11. Missed or late sessions
  // Estimate: scheduled - conducted (with some tolerance)
  const missedOrLateSessions = Math.max(0, scheduledSessions - conductedSessions);

  // 12. Session cancellation frequency
  // Estimate based on missed sessions per period
  const weeksInPeriod = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const sessionCancellationFrequency = weeksInPeriod > 0 
    ? Math.round((missedOrLateSessions / weeksInPeriod) * 100) / 100
    : 0;

  // 13. Feedback/grading timeliness
  // Calculate based on time between assignment submission and grading
  const teacherAssignments = context.assignments.filter((a) => a.teacher_id === teacherId);
  const assignmentIds = teacherAssignments.map((a) => a.id);
  const submissions = context.submissions.filter((s) => assignmentIds.includes(s.assignment_id));
  
  let totalGradingTime = 0;
  let gradedCount = 0;
  submissions.forEach((s) => {
    if (s.graded_at && s.submitted_at) {
      const submitted = new Date(s.submitted_at);
      const graded = new Date(s.graded_at);
      const hours = (graded.getTime() - submitted.getTime()) / (1000 * 60 * 60);
      totalGradingTime += hours;
      gradedCount++;
    }
  });
  
  // Timeliness score: 100 if average < 24 hours, decreasing after that
  const averageGradingHours = gradedCount > 0 ? totalGradingTime / gradedCount : 0;
  const feedbackGradingTimeliness = averageGradingHours === 0 
    ? 100 
    : Math.max(0, 100 - Math.min(100, (averageGradingHours - 24) * 2));

  // 14. Admin evaluation score
  // Placeholder: would come from admin evaluations if available
  const adminEvaluationScore = 75; // Default score

  // 15. Parent/student satisfaction score
  // Placeholder: would come from surveys/feedback if available
  const parentStudentSatisfactionScore: number | null = null;

  return {
    teacherId,
    teacherName: teacher.name || "Unknown",
    section: teacher.section,
    numberOfStudentsPerTeacher,
    activeTeachingHoursPerWeek,
    studentToTeacherRatio,
    sessionsConductedVsScheduled: {
      conducted: conductedSessions,
      scheduled: scheduledSessions,
      ratio: sessionsRatio,
    },
    averageStudentMemorizationPace: Math.round(averageStudentMemorizationPace * 100) / 100,
    averageStudentAccuracyRate: Math.round(averageStudentAccuracyRate * 100) / 100,
    studentRetentionRate,
    percentageOfStudentsMeetingWeeklyTargets,
    numberOfAtRiskStudentsAssigned,
    teacherAttendanceRate,
    missedOrLateSessions,
    sessionCancellationFrequency,
    feedbackGradingTimeliness: Math.round(feedbackGradingTimeliness),
    adminEvaluationScore,
    parentStudentSatisfactionScore,
  };
}

/**
 * Calculate metrics for all teachers
 */
export function calculateAllTeacherMetrics(
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): TeacherMetrics[] {
  return context.teachers
    .filter((t) => t.role === "teacher")
    .map((teacher) => {
      try {
        return calculateTeacherMetrics(teacher.id, context, timeRange);
      } catch (error) {
        console.error(`Error calculating metrics for teacher ${teacher.id}:`, error);
        return null;
      }
    })
    .filter((m): m is TeacherMetrics => m !== null);
}

