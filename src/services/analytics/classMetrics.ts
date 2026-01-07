/**
 * Class Metrics Calculator
 * Implements all 5 required class metrics
 */

import type { ClassMetrics, AnalyticsDataContext } from "@/types/analytics.ts";
import { calculatePercentage, calculateStandardDeviation } from "./analyticsCalculator.ts";
import { calculateStudentMetrics } from "./studentMetrics.ts";

/**
 * Calculate all class metrics for a single class
 */
export function calculateClassMetrics(
  classId: string,
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): ClassMetrics {
  const classData = context.classes.find((c) => c.id === classId);
  if (!classData) {
    throw new Error(`Class ${classId} not found`);
  }

  // Get students in this class
  const classStudentIds = Array.isArray(classData.current_students) 
    ? classData.current_students 
    : [];
  const classStudents = context.students.filter((s) => classStudentIds.includes(s.id));

  // Calculate student metrics for all students in class
  const studentMetrics = classStudents
    .map((student) => {
      try {
        return calculateStudentMetrics(student.id, context, timeRange);
      } catch {
        return null;
      }
    })
    .filter((m): m is ReturnType<typeof calculateStudentMetrics> => m !== null);

  // 1. Average progress per class
  const totalPages = studentMetrics.reduce((sum, m) => 
    sum + m.totalPagesMemorized.lifetime, 0
  );
  const averageProgressPerClass = studentMetrics.length > 0
    ? Math.round((totalPages / studentMetrics.length) * 100) / 100
    : 0;

  // 2. Class attendance rate
  const classAttendance = context.attendance.filter((a) => 
    classStudentIds.includes(a.student_id)
  );
  const presentCount = classAttendance.filter((a) => a.status === "present").length;
  const classAttendanceRate = calculatePercentage(presentCount, classAttendance.length);

  // 3. Variance in student pace
  const studentPaces = studentMetrics.map((m) => m.averageMemorizationPace.pagesPerWeek);
  const varianceInStudentPace = calculateStandardDeviation(studentPaces);

  // 4. Capacity utilization
  const capacity = classData.capacity || 0;
  const currentStudents = classStudentIds.length;
  const capacityUtilization = calculatePercentage(currentStudents, capacity || 1);

  // 5. Drop-off rate per class
  // Calculate based on students who were enrolled but are now inactive
  const activeStudents = classStudents.filter((s) => s.status === "active").length;
  const dropOffRatePerClass = calculatePercentage(
    currentStudents - activeStudents,
    currentStudents || 1
  );

  return {
    classId,
    className: classData.name || "Unknown",
    averageProgressPerClass,
    classAttendanceRate,
    varianceInStudentPace,
    capacityUtilization,
    dropOffRatePerClass,
  };
}

/**
 * Calculate metrics for all classes
 */
export function calculateAllClassMetrics(
  context: AnalyticsDataContext,
  timeRange?: { from: Date; to: Date }
): ClassMetrics[] {
  return context.classes
    .filter((c) => c.status === "active" || !c.status)
    .map((classData) => {
      try {
        return calculateClassMetrics(classData.id, context, timeRange);
      } catch (error) {
        console.error(`Error calculating metrics for class ${classData.id}:`, error);
        return null;
      }
    })
    .filter((m): m is ClassMetrics => m !== null);
}

