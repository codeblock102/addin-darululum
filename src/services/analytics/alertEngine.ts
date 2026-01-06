/**
 * Alert Engine
 * Implements all 5 mandatory alert types with threshold monitoring
 */

import type { AnalyticsAlert, AlertType, AlertSeverity, AnalyticsDataContext } from "@/types/analytics.ts";
import { calculateAllStudentMetrics } from "./studentMetrics.ts";
import { calculateAllTeacherMetrics } from "./teacherMetrics.ts";
import { calculateAllClassMetrics } from "./classMetrics.ts";
import { subWeeks } from "date-fns";

/**
 * Alert thresholds configuration
 */
const ALERT_THRESHOLDS = {
  missed_sessions_threshold: {
    threshold: 3, // 3 missed sessions triggers alert
    severity: "high" as AlertSeverity,
  },
  memorization_pace_drop: {
    threshold: 30, // 30% drop in pace triggers alert
    severity: "medium" as AlertSeverity,
  },
  high_at_risk_concentration: {
    threshold: 5, // 5+ at-risk students per teacher
    severity: "high" as AlertSeverity,
  },
  class_overcapacity: {
    threshold: 95, // 95% capacity triggers alert
    severity: "medium" as AlertSeverity,
  },
  excessive_teacher_cancellations: {
    threshold: 3, // 3+ cancellations per week
    severity: "high" as AlertSeverity,
  },
};

/**
 * Generate missed sessions threshold alerts
 */
function generateMissedSessionsAlerts(
  teacherMetrics: ReturnType<typeof import("./teacherMetrics.ts").calculateAllTeacherMetrics>,
  context: AnalyticsDataContext
): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  const threshold = ALERT_THRESHOLDS.missed_sessions_threshold;

  teacherMetrics.forEach((teacher) => {
    const missedSessions = teacher.missedOrLateSessions;
    if (missedSessions >= threshold.threshold) {
      alerts.push({
        id: `missed_sessions_${teacher.teacherId}_${Date.now()}`,
        type: "missed_sessions_threshold",
        severity: threshold.severity,
        status: "active",
        title: "High Number of Missed Sessions",
        description: `${teacher.teacherName} has ${missedSessions} missed or late sessions. Action: Address attendance, review policies, provide support.`,
        entityId: teacher.teacherId,
        entityName: teacher.teacherName,
        entityType: "teacher",
        threshold: threshold.threshold,
        currentValue: missedSessions,
        createdAt: new Date().toISOString(),
        metadata: {
          teacherId: teacher.teacherId,
          sessionsConducted: teacher.sessionsConductedVsScheduled.conducted,
          sessionsScheduled: teacher.sessionsConductedVsScheduled.scheduled,
          action: "Address attendance issues, review policies, provide support",
        },
      });
    }
  });

  return alerts;
}

/**
 * Generate memorization pace drop alerts
 */
function generateMemorizationPaceDropAlerts(
  studentMetrics: ReturnType<typeof calculateAllStudentMetrics>,
  context: AnalyticsDataContext
): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  const threshold = ALERT_THRESHOLDS.memorization_pace_drop;
  const now = new Date();

  studentMetrics.forEach((student) => {
    // Compare recent pace (last week) vs previous week
    // This is simplified - in production, you'd track historical pace data
    const currentPace = student.totalPagesMemorized.weekly;
    const averagePace = student.averageMemorizationPace.pagesPerWeek;
    
    // If current pace is significantly below average, trigger alert
    if (averagePace > 0 && currentPace < averagePace * (1 - threshold.threshold / 100)) {
      const dropPercentage = ((averagePace - currentPace) / averagePace) * 100;
      alerts.push({
        id: `pace_drop_${student.studentId}_${Date.now()}`,
        type: "memorization_pace_drop",
        severity: threshold.severity,
        status: "active",
        title: "Memorization Pace Drop Detected",
        description: `${student.studentName} pace dropped by ${Math.round(dropPercentage)}%. Action: Contact student/parent, review progress, check external factors.`,
        entityId: student.studentId,
        entityName: student.studentName,
        entityType: "student",
        threshold: threshold.threshold,
        currentValue: dropPercentage,
        createdAt: new Date().toISOString(),
        metadata: {
          studentId: student.studentId,
          currentPace,
          averagePace,
        },
      });
    }
  });

  return alerts;
}

/**
 * Generate high at-risk student concentration alerts
 */
function generateHighAtRiskConcentrationAlerts(
  teacherMetrics: ReturnType<typeof import("./teacherMetrics.ts").calculateAllTeacherMetrics>,
  context: AnalyticsDataContext
): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  const threshold = ALERT_THRESHOLDS.high_at_risk_concentration;

  teacherMetrics.forEach((teacher) => {
    const atRiskCount = teacher.numberOfAtRiskStudentsAssigned;
    if (atRiskCount >= threshold.threshold) {
      alerts.push({
        id: `at_risk_concentration_${teacher.teacherId}_${Date.now()}`,
        type: "high_at_risk_concentration",
        severity: threshold.severity,
        status: "active",
        title: "High At-Risk Student Concentration",
        description: `${teacher.teacherName} has ${atRiskCount} at-risk students assigned. Action: Review teacher workload, provide additional support, consider reassignment.`,
        entityId: teacher.teacherId,
        entityName: teacher.teacherName,
        entityType: "teacher",
        threshold: threshold.threshold,
        currentValue: atRiskCount,
        createdAt: new Date().toISOString(),
        metadata: {
          teacherId: teacher.teacherId,
          totalStudents: teacher.numberOfStudentsPerTeacher,
        },
      });
    }
  });

  return alerts;
}

/**
 * Generate class overcapacity alerts
 */
function generateClassOvercapacityAlerts(
  classMetrics: ReturnType<typeof calculateAllClassMetrics>,
  context: AnalyticsDataContext
): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  const threshold = ALERT_THRESHOLDS.class_overcapacity;

  classMetrics.forEach((classMetric) => {
    if (classMetric.capacityUtilization >= threshold.threshold) {
      alerts.push({
        id: `overcapacity_${classMetric.classId}_${Date.now()}`,
        type: "class_overcapacity",
        severity: threshold.severity,
        status: "active",
        title: "Class Overcapacity Alert",
        description: `${classMetric.className} is at ${Math.round(classMetric.capacityUtilization)}% capacity. Action: Split class, increase capacity, or create new section.`,
        entityId: classMetric.classId,
        entityName: classMetric.className,
        entityType: "class",
        threshold: threshold.threshold,
        currentValue: classMetric.capacityUtilization,
        createdAt: new Date().toISOString(),
        metadata: {
          classId: classMetric.classId,
        },
      });
    }
  });

  return alerts;
}

/**
 * Generate excessive teacher cancellations alerts
 */
function generateExcessiveCancellationsAlerts(
  teacherMetrics: ReturnType<typeof import("./teacherMetrics.ts").calculateAllTeacherMetrics>,
  context: AnalyticsDataContext
): AnalyticsAlert[] {
  const alerts: AnalyticsAlert[] = [];
  const threshold = ALERT_THRESHOLDS.excessive_teacher_cancellations;

  teacherMetrics.forEach((teacher) => {
    const cancellationFrequency = teacher.sessionCancellationFrequency;
    if (cancellationFrequency >= threshold.threshold) {
      alerts.push({
        id: `excessive_cancellations_${teacher.teacherId}_${Date.now()}`,
        type: "excessive_teacher_cancellations",
        severity: threshold.severity,
        status: "active",
        title: "Excessive Session Cancellations",
        description: `${teacher.teacherName} has ${cancellationFrequency.toFixed(1)} cancellations per week. Action: Review scheduling, address root cause, consider backup plans.`,
        entityId: teacher.teacherId,
        entityName: teacher.teacherName,
        entityType: "teacher",
        threshold: threshold.threshold,
        currentValue: cancellationFrequency,
        createdAt: new Date().toISOString(),
        metadata: {
          teacherId: teacher.teacherId,
          missedSessions: teacher.missedOrLateSessions,
        },
      });
    }
  });

  return alerts;
}

/**
 * Generate all alerts based on current metrics
 */
export function generateAllAlerts(
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): AnalyticsAlert[] {
  const studentMetrics = calculateAllStudentMetrics(context, timeRange);
  const teacherMetrics = calculateAllTeacherMetrics(context, timeRange);
  const classMetrics = calculateAllClassMetrics(context, timeRange);

  const alerts: AnalyticsAlert[] = [
    ...generateMissedSessionsAlerts(teacherMetrics, context),
    ...generateMemorizationPaceDropAlerts(studentMetrics, context),
    ...generateHighAtRiskConcentrationAlerts(teacherMetrics, context),
    ...generateClassOvercapacityAlerts(classMetrics, context),
    ...generateExcessiveCancellationsAlerts(teacherMetrics, context),
  ];

  // Sort by severity and creation time
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return alerts.sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Check if alert should be triggered based on threshold
 */
export function shouldTriggerAlert(
  currentValue: number,
  threshold: number,
  alertType: AlertType
): boolean {
  const config = ALERT_THRESHOLDS[alertType];
  if (!config) return false;

  switch (alertType) {
    case "missed_sessions_threshold":
    case "high_at_risk_concentration":
    case "excessive_teacher_cancellations":
      return currentValue >= threshold;
    case "memorization_pace_drop":
      return currentValue >= threshold; // Drop percentage
    case "class_overcapacity":
      return currentValue >= threshold; // Capacity percentage
    default:
      return false;
  }
}

