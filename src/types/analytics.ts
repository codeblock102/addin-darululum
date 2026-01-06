/**
 * Comprehensive Analytics Types
 * All metrics are first-class features, not optional add-ons
 */

export type TimePeriod = "lifetime" | "weekly" | "monthly";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus = "active" | "acknowledged" | "resolved";

/**
 * STUDENT METRICS (18 required metrics)
 */
export interface StudentMetrics {
  // Basic identifiers
  studentId: string;
  studentName: string;
  section?: string | null;
  
  // Progress Metrics
  totalPagesMemorized: {
    lifetime: number;
    weekly: number;
    monthly: number;
  };
  averageMemorizationPace: {
    pagesPerDay: number;
    pagesPerWeek: number;
  };
  activeRevisionLoad: number; // Number of pages under review
  revisionRetentionScore: number; // 0-100 score
  accuracyRateDuringTasmi: number; // % mistakes (0-100, lower is better)
  completionPercentage: {
    currentJuz: number; // % completion of current Juz
    totalHifzGoal: number; // % completion toward total Hifz goal (30 Juz)
  };
  stagnationDetection: {
    isStagnant: boolean;
    daysSinceLastProgress: number;
    thresholdDays: number;
  };
  
  // Attendance Metrics
  attendanceRate: number; // 0-100
  lateArrivalsCount: number;
  absences: {
    excused: number;
    unexcused: number;
    total: number;
  };
  consecutiveAbsenceStreaks: number; // Longest consecutive absence streak
  
  // Assignment & Practice Metrics
  homeworkAssignmentCompletionRate: number; // 0-100
  practiceConsistencyScore: number; // 0-100 score
  
  // Teacher & Risk Metrics
  teacherEffortRating: number; // 0-100 score (based on teacher engagement)
  atRiskCompositeScore: number; // 0-100 composite risk score
  burnoutWarningFlag: boolean;
  dropOffProbabilityIndicator: number; // 0-100 probability
}

/**
 * TEACHER METRICS (15 required metrics)
 */
export interface TeacherMetrics {
  // Basic identifiers
  teacherId: string;
  teacherName: string;
  section?: string | null;
  
  // Student Management
  numberOfStudentsPerTeacher: number;
  studentToTeacherRatio: number;
  numberOfAtRiskStudentsAssigned: number;
  
  // Teaching Activity
  activeTeachingHoursPerWeek: number;
  sessionsConductedVsScheduled: {
    conducted: number;
    scheduled: number;
    ratio: number; // 0-100
  };
  teacherAttendanceRate: number; // 0-100
  missedOrLateSessions: number;
  sessionCancellationFrequency: number; // Cancellations per period
  
  // Student Performance Under Teacher
  averageStudentMemorizationPace: number; // Pages per week
  averageStudentAccuracyRate: number; // 0-100 (lower mistakes = higher accuracy)
  studentRetentionRate: number; // 0-100
  percentageOfStudentsMeetingWeeklyTargets: number; // 0-100
  
  // Quality Metrics
  feedbackGradingTimeliness: number; // 0-100 score (based on time to grade)
  adminEvaluationScore: number; // 0-100
  parentStudentSatisfactionScore: number | null; // 0-100 (if applicable)
}

/**
 * CLASS / GROUP METRICS (5 required metrics)
 */
export interface ClassMetrics {
  // Basic identifiers
  classId: string;
  className: string;
  
  // Performance Metrics
  averageProgressPerClass: number; // Average pages memorized per student
  classAttendanceRate: number; // 0-100
  varianceInStudentPace: number; // Standard deviation of student pace
  
  // Capacity Metrics
  capacityUtilization: number; // 0-100 (current_students / capacity)
  dropOffRatePerClass: number; // % of students who dropped
}

/**
 * PROGRAM-LEVEL METRICS (9 required metrics)
 */
export interface ProgramMetrics {
  // Memorization Metrics
  overallMemorizationVelocity: number; // Average pages per week across all students
  percentageStudentsOnTrackVsBehind: {
    onTrack: number; // % of students
    behind: number; // % of students
  };
  averageInstitutionalAccuracyRate: number; // 0-100
  
  // Retention & Enrollment
  monthlyStudentRetention: number; // 0-100
  enrollmentsVsWithdrawals: {
    enrollments: number;
    withdrawals: number;
    netChange: number;
  };
  averageStudentLifetime: number; // Average days a student stays enrolled
  
  // Teacher Metrics
  teacherTurnoverRate: number; // % of teachers who left
  teacherUtilizationRate: number; // 0-100 (active hours / available hours)
  sessionsDeliveredVsPlanned: {
    delivered: number;
    planned: number;
    ratio: number; // 0-100
  };
}

/**
 * ALERT & TRIGGER SYSTEM (5 mandatory alert types)
 */
export interface AnalyticsAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  entityId: string; // student_id, teacher_id, or class_id
  entityName: string;
  entityType: "student" | "teacher" | "class" | "program";
  threshold: number;
  currentValue: number;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

export type AlertType =
  | "missed_sessions_threshold"
  | "memorization_pace_drop"
  | "high_at_risk_concentration"
  | "class_overcapacity"
  | "excessive_teacher_cancellations";

/**
 * Analytics Data Context
 */
export interface AnalyticsDataContext {
  students: any[];
  teachers: any[];
  classes: any[];
  progress: any[];
  attendance: any[];
  assignments: any[];
  submissions: any[];
  juzRevisions: any[];
  sabaqPara: any[];
  communications: any[];
}

/**
 * Time Range for Analytics
 */
export interface AnalyticsTimeRange {
  from: Date;
  to: Date;
  period: TimePeriod;
}

/**
 * Metric Calculation Result
 */
export interface MetricCalculationResult<T> {
  data: T;
  calculatedAt: string;
  timeRange: AnalyticsTimeRange;
  metadata?: {
    dataQuality: "excellent" | "good" | "fair" | "poor";
    missingDataPoints?: number;
    warnings?: string[];
  };
}

