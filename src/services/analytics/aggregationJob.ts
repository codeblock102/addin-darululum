/**
 * Daily Analytics Aggregation Job
 * Computes essential metrics once per day and stores in analytics_summary table
 * This avoids heavy calculations on every page load
 */

import { supabase } from "@/integrations/supabase/client.ts";
import type { AnalyticsDataContext } from "@/types/analytics.ts";
import { fetchStudentAnalyticsData } from "@/hooks/useStudentAnalytics.ts";
import { calculateAllStudentMetrics } from "./studentMetrics.ts";
import { calculateAllTeacherMetrics } from "./teacherMetrics.ts";
import { calculateAllClassMetrics } from "./classMetrics.ts";
import { generateAllAlerts } from "./alertEngine.ts";
import { subDays, subMonths, startOfDay, startOfWeek } from "date-fns";

/**
 * Calculate and store daily analytics summary
 */
export async function runDailyAnalyticsAggregation(institutionId?: string): Promise<void> {
  const today = startOfDay(new Date());
  const todayDate = today.toISOString().split("T")[0];
  
  console.log(`[Analytics Aggregation] Starting daily aggregation for ${todayDate}`);

  try {
    // Fetch all raw data (this runs once per day, not on every page load)
    const context = await fetchStudentAnalyticsData({
      from: subMonths(today, 3), // Last 3 months for context
      to: today,
    });

    // Calculate essential metrics
    const metrics = await calculateEssentialMetrics(context, today);

    // Store in summary table
    const { error: summaryError } = await supabase
      .from("analytics_summary")
      .upsert({
        date: todayDate,
        institution_id: institutionId || null,
        ...metrics,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "date,institution_id",
      });

    if (summaryError) {
      console.error("[Analytics Aggregation] Error storing summary:", summaryError);
      throw summaryError;
    }

    // Populate student_metrics_summary (daily)
    await populateStudentMetricsSummary(context, today, todayDate);

    // Populate teacher_metrics_summary (weekly)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekStartDate = weekStart.toISOString().split("T")[0];
    await populateTeacherMetricsSummary(context, today, weekStartDate);

    // Populate class_metrics_summary (weekly)
    await populateClassMetricsSummary(context, today, weekStartDate);

    // Populate analytics_alerts (daily)
    await populateAnalyticsAlerts(context, today, todayDate);

    console.log(`[Analytics Aggregation] Successfully aggregated all metrics for ${todayDate}`);
  } catch (error) {
    console.error("[Analytics Aggregation] Fatal error:", error);
    throw error;
  }
}

/**
 * Calculate only the 7 essential metrics
 */
async function calculateEssentialMetrics(
  context: AnalyticsDataContext,
  today: Date
): Promise<{
  total_active_students: number;
  students_on_track_count: number;
  students_on_track_percentage: number;
  at_risk_students_count: number;
  at_risk_students_percentage: number;
  overall_attendance_rate: number;
  overall_memorization_velocity: number;
  total_active_teachers: number;
  teachers_with_at_risk_count: number;
  teachers_with_at_risk_percentage: number;
  avg_session_reliability: number;
  student_retention_30day: number;
}> {
  // Calculate student metrics (only what we need)
  const allStudentMetrics = calculateAllStudentMetrics(context, {
    from: subDays(today, 30),
    to: today,
  });

  const activeStudents = allStudentMetrics.filter((m) => m);
  const totalActiveStudents = activeStudents.length;

  // 1. % Students On Track (meeting weekly target of 5 pages/week)
  const weeklyTarget = 5;
  const studentsOnTrack = activeStudents.filter(
    (m) => m.averageMemorizationPace.pagesPerWeek >= weeklyTarget
  ).length;
  const studentsOnTrackPercentage = totalActiveStudents > 0
    ? (studentsOnTrack / totalActiveStudents) * 100
    : 0;

  // 2. % At-Risk Students
  const atRiskStudents = activeStudents.filter(
    (m) => m.atRiskCompositeScore >= 50
  ).length;
  const atRiskStudentsPercentage = totalActiveStudents > 0
    ? (atRiskStudents / totalActiveStudents) * 100
    : 0;

  // 3. Overall Attendance Rate
  const overallAttendanceRate = activeStudents.length > 0
    ? activeStudents.reduce((sum, m) => sum + m.attendanceRate, 0) / activeStudents.length
    : 0;

  // 4. Overall Memorization Velocity
  const overallMemorizationVelocity = activeStudents.length > 0
    ? activeStudents.reduce((sum, m) => sum + m.averageMemorizationPace.pagesPerWeek, 0) / activeStudents.length
    : 0;

  // Calculate teacher metrics (only what we need)
  const allTeacherMetrics = calculateAllTeacherMetrics(context, {
    from: subDays(today, 30),
    to: today,
  });

  const activeTeachers = allTeacherMetrics.filter((m) => m);
  const totalActiveTeachers = activeTeachers.length;

  // 5. % Teachers with At-Risk Students (≥5 at-risk students)
  const teachersWithAtRisk = activeTeachers.filter(
    (m) => m.numberOfAtRiskStudentsAssigned >= 5
  ).length;
  const teachersWithAtRiskPercentage = totalActiveTeachers > 0
    ? (teachersWithAtRisk / totalActiveTeachers) * 100
    : 0;

  // 6. Teacher Session Reliability (average of session completion rates)
  const avgSessionReliability = activeTeachers.length > 0
    ? activeTeachers.reduce((sum, m) => sum + m.sessionsConductedVsScheduled.ratio, 0) / activeTeachers.length
    : 0;

  // 7. Student Retention (30-day)
  // Compare active students today vs 30 days ago
  const thirtyDaysAgo = subDays(today, 30);
  const studentsThirtyDaysAgo = context.students.filter((s) => {
    if (!s.enrollment_date) return false;
    const enrollmentDate = new Date(s.enrollment_date);
    return enrollmentDate <= thirtyDaysAgo && s.status === "active";
  }).length;

  const studentRetention30Day = studentsThirtyDaysAgo > 0
    ? (totalActiveStudents / studentsThirtyDaysAgo) * 100
    : 100;

  return {
    total_active_students: totalActiveStudents,
    students_on_track_count: studentsOnTrack,
    students_on_track_percentage: Math.round(studentsOnTrackPercentage * 100) / 100,
    at_risk_students_count: atRiskStudents,
    at_risk_students_percentage: Math.round(atRiskStudentsPercentage * 100) / 100,
    overall_attendance_rate: Math.round(overallAttendanceRate * 100) / 100,
    overall_memorization_velocity: Math.round(overallMemorizationVelocity * 100) / 100,
    total_active_teachers: totalActiveTeachers,
    teachers_with_at_risk_count: teachersWithAtRisk,
    teachers_with_at_risk_percentage: Math.round(teachersWithAtRiskPercentage * 100) / 100,
    avg_session_reliability: Math.round(avgSessionReliability * 100) / 100,
    student_retention_30day: Math.round(studentRetention30Day * 100) / 100,
  };
}

/**
 * Populate student_metrics_summary table
 */
async function populateStudentMetricsSummary(
  context: AnalyticsDataContext,
  today: Date,
  todayDate: string
): Promise<void> {
  console.log(`[Analytics Aggregation] Populating student_metrics_summary for ${todayDate}`);

  const allStudentMetrics = calculateAllStudentMetrics(context, {
    from: subDays(today, 30),
    to: today,
  });

  const studentSummaries = allStudentMetrics.map((student) => {
    const studentData = context.students.find((s) => s.id === student.studentId);
    return {
      date: todayDate,
      student_id: student.studentId,
      student_name: student.studentName || studentData?.name || "Unknown",
      at_risk_score: Math.round(student.atRiskCompositeScore * 100) / 100,
      memorization_pace: Math.round(student.averageMemorizationPace.pagesPerWeek * 100) / 100,
      attendance_rate: Math.round(student.attendanceRate * 100) / 100,
      is_stagnant: student.stagnationDetection.isStagnant,
      days_since_progress: student.stagnationDetection.daysSinceLastProgress,
      updated_at: new Date().toISOString(),
    };
  });

  if (studentSummaries.length === 0) {
    console.log("[Analytics Aggregation] No student metrics to store");
    return;
  }

  // Upsert all student summaries
  const { error } = await supabase
    .from("student_metrics_summary")
    .upsert(studentSummaries, {
      onConflict: "date,student_id",
    });

  if (error) {
    console.error("[Analytics Aggregation] Error storing student metrics:", error);
    throw error;
  }

  console.log(`[Analytics Aggregation] Stored ${studentSummaries.length} student metrics`);
}

/**
 * Populate teacher_metrics_summary table
 */
async function populateTeacherMetricsSummary(
  context: AnalyticsDataContext,
  today: Date,
  weekStartDate: string
): Promise<void> {
  console.log(`[Analytics Aggregation] Populating teacher_metrics_summary for week ${weekStartDate}`);

  const allTeacherMetrics = calculateAllTeacherMetrics(context, {
    from: subDays(today, 30),
    to: today,
  });

  const teacherSummaries = allTeacherMetrics.map((teacher) => {
    const teacherData = context.teachers.find((t) => t.id === teacher.teacherId);
    return {
      week_start: weekStartDate,
      teacher_id: teacher.teacherId,
      teacher_name: teacher.teacherName || teacherData?.name || "Unknown",
      student_count: teacher.numberOfStudentsPerTeacher,
      avg_student_pace: Math.round(teacher.averageStudentMemorizationPace.pagesPerWeek * 100) / 100,
      at_risk_students_count: teacher.numberOfAtRiskStudentsAssigned,
      session_reliability: Math.round(teacher.sessionsConductedVsScheduled.ratio * 100) / 100,
      updated_at: new Date().toISOString(),
    };
  });

  if (teacherSummaries.length === 0) {
    console.log("[Analytics Aggregation] No teacher metrics to store");
    return;
  }

  // Upsert all teacher summaries
  const { error } = await supabase
    .from("teacher_metrics_summary")
    .upsert(teacherSummaries, {
      onConflict: "week_start,teacher_id",
    });

  if (error) {
    console.error("[Analytics Aggregation] Error storing teacher metrics:", error);
    throw error;
  }

  console.log(`[Analytics Aggregation] Stored ${teacherSummaries.length} teacher metrics`);
}

/**
 * Populate class_metrics_summary table
 */
async function populateClassMetricsSummary(
  context: AnalyticsDataContext,
  today: Date,
  weekStartDate: string
): Promise<void> {
  console.log(`[Analytics Aggregation] Populating class_metrics_summary for week ${weekStartDate}`);

  const allClassMetrics = calculateAllClassMetrics(context, {
    from: subDays(today, 30),
    to: today,
  });

  const classSummaries = allClassMetrics.map((classMetric) => {
    const classData = context.classes.find((c) => c.id === classMetric.classId);
    const studentCount = Array.isArray(classData?.current_students)
      ? classData.current_students.length
      : 0;
    const capacity = classData?.capacity || 0;

    return {
      week_start: weekStartDate,
      class_id: classMetric.classId,
      class_name: classMetric.className || classData?.name || "Unknown",
      student_count: studentCount,
      capacity: capacity,
      capacity_utilization: Math.round(classMetric.capacityUtilization * 100) / 100,
      avg_progress: Math.round(classMetric.averageProgressPerClass * 100) / 100,
      attendance_rate: Math.round(classMetric.classAttendanceRate * 100) / 100,
      dropoff_rate: Math.round(classMetric.dropOffRatePerClass * 100) / 100,
      updated_at: new Date().toISOString(),
    };
  });

  if (classSummaries.length === 0) {
    console.log("[Analytics Aggregation] No class metrics to store");
    return;
  }

  // Upsert all class summaries
  const { error } = await supabase
    .from("class_metrics_summary")
    .upsert(classSummaries, {
      onConflict: "week_start,class_id",
    });

  if (error) {
    console.error("[Analytics Aggregation] Error storing class metrics:", error);
    throw error;
  }

  console.log(`[Analytics Aggregation] Stored ${classSummaries.length} class metrics`);
}

/**
 * Populate analytics_alerts table
 */
async function populateAnalyticsAlerts(
  context: AnalyticsDataContext,
  today: Date,
  todayDate: string
): Promise<void> {
  console.log(`[Analytics Aggregation] Populating analytics_alerts for ${todayDate}`);

  // Generate all alerts
  const alerts = generateAllAlerts(context, {
    from: subDays(today, 7),
    to: today,
  });

  // Get current alert IDs for today
  const currentAlertIds = new Set(alerts.map((a) => a.id));

  // Convert alerts to database format
  const alertRecords = alerts.map((alert) => ({
    date: todayDate,
    type: alert.type,
    severity: alert.severity,
    status: alert.status,
    entity_id: alert.entityId,
    entity_name: alert.entityName,
    entity_type: alert.entityType,
    title: alert.title,
    description: alert.description,
    threshold: alert.threshold,
    current_value: alert.currentValue,
    action_recommendation: alert.metadata?.action as string || "",
    created_at: alert.createdAt,
    acknowledged_at: alert.acknowledgedAt || null,
    resolved_at: alert.resolvedAt || null,
    metadata: alert.metadata || {},
  }));

  if (alertRecords.length === 0) {
    console.log("[Analytics Aggregation] No alerts to store");
    return;
  }

  // Delete old active alerts for today that are no longer in the current alert set
  // This ensures we don't have stale alerts, but preserves acknowledged/resolved ones
  const { data: existingAlerts } = await supabase
    .from("analytics_alerts")
    .select("id")
    .eq("date", todayDate)
    .eq("status", "active");

  if (existingAlerts) {
    const alertsToDelete = existingAlerts
      .filter((a) => !currentAlertIds.has(a.id))
      .map((a) => a.id);

    if (alertsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("analytics_alerts")
        .delete()
        .in("id", alertsToDelete);

      if (deleteError) {
        console.warn("[Analytics Aggregation] Error deleting old active alerts:", deleteError);
      }
    }
  }

  const { error: insertError } = await supabase
    .from("analytics_alerts")
    .insert(alertRecords);

  if (insertError) {
    console.error("[Analytics Aggregation] Error storing alerts:", insertError);
    throw insertError;
  }

  console.log(`[Analytics Aggregation] Stored ${alertRecords.length} alerts`);
}

