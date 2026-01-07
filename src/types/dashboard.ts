/**
 * Dashboard KPI Definitions, Thresholds, and Actions
 */

export type ThresholdStatus = "green" | "yellow" | "red";

export interface ThresholdConfig {
  green: { min?: number; max?: number };
  yellow: { min?: number; max?: number };
  red: { min?: number; max?: number };
}

export interface KPIDefinition {
  id: string;
  name: string;
  formula: string;
  displayType: "percentage" | "number" | "count";
  unit?: string;
  thresholds: ThresholdConfig;
  redAction: string;
  comparisonPeriod: "week" | "month" | "none";
  drillDown?: {
    enabled: boolean;
    route?: string;
    entityType?: "student" | "teacher" | "class";
  };
}

export interface TrendData {
  current: number;
  previous: number;
  change: number; // percentage change
  isPositive: boolean; // true if improvement
}

export interface KPIValue {
  definition: KPIDefinition;
  value: number;
  trend?: TrendData;
  status: ThresholdStatus;
  onClick?: () => void;
}

/**
 * Calculate threshold status based on value and config
 */
export function calculateThresholdStatus(
  value: number,
  thresholds: ThresholdConfig
): ThresholdStatus {
  // Check red first (highest priority)
  if (thresholds.red.min !== undefined && value < thresholds.red.min) return "red";
  if (thresholds.red.max !== undefined && value > thresholds.red.max) return "red";
  
  // Check yellow
  if (thresholds.yellow.min !== undefined && value < thresholds.yellow.min) return "yellow";
  if (thresholds.yellow.max !== undefined && value > thresholds.yellow.max) return "yellow";
  
  // Default to green
  return "green";
}

/**
 * Essential KPIs Only (7 total)
 * Optimized for fast loading - all metrics pre-aggregated daily
 */
export const essentialKPIs: KPIDefinition[] = [
  // STUDENTS (2 metrics)
  {
    id: "students_on_track",
    name: "Students On Track",
    formula: "(Students meeting weekly target / Total active students) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 70 },
      yellow: { min: 50, max: 69 },
      red: { max: 49 },
    },
    redAction: "Review class schedules, identify struggling teachers, check target settings",
    comparisonPeriod: "week",
  },
  {
    id: "at_risk_students",
    name: "At-Risk Students",
    formula: "(Students with atRiskCompositeScore ≥ 50 / Total active students) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { max: 10 },
      yellow: { min: 11, max: 20 },
      red: { min: 21 },
    },
    redAction: "Review at-risk list immediately, assign interventions, check teacher support",
    comparisonPeriod: "none",
  },
  // TEACHERS (2 metrics)
  {
    id: "teachers_with_at_risk",
    name: "Teachers with At-Risk Students",
    formula: "(Teachers with ≥5 at-risk students / Total teachers) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { max: 20 },
      yellow: { min: 21, max: 40 },
      red: { min: 41 },
    },
    redAction: "Review teacher workload, provide additional support, consider reassignment",
    comparisonPeriod: "none",
  },
  {
    id: "teacher_session_reliability",
    name: "Teacher Session Reliability",
    formula: "Average (sessionsConducted / sessionsScheduled) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 90 },
      yellow: { min: 80, max: 89 },
      red: { max: 79 },
    },
    redAction: "Review attendance policies, address cancellation patterns, check scheduling",
    comparisonPeriod: "month",
  },
  // PROGRAM (3 metrics)
  {
    id: "memorization_velocity",
    name: "Memorization Velocity",
    formula: "Average pages per week across all students",
    displayType: "number",
    unit: "pages/week",
    thresholds: {
      green: { min: 5.0 },
      yellow: { min: 3.0, max: 4.9 },
      red: { max: 2.9 },
    },
    redAction: "Investigate low-performing classes, review teacher engagement, check student attendance",
    comparisonPeriod: "month",
  },
  {
    id: "student_retention",
    name: "Student Retention (30-day)",
    formula: "(Active students this month / Active students last month) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 95 },
      yellow: { min: 90, max: 94 },
      red: { max: 89 },
    },
    redAction: "Identify drop-off patterns, review at-risk students, check parent engagement",
    comparisonPeriod: "month",
  },
  {
    id: "active_students_count",
    name: "Active Students",
    formula: "Count of active students",
    displayType: "count",
    thresholds: {
      green: { min: 0 },
      yellow: { min: 0 },
      red: { min: 0 },
    },
    redAction: "N/A",
    comparisonPeriod: "none",
  },
];

/**
 * Legacy KPI definitions (kept for backward compatibility, but not used in optimized dashboard)
 * @deprecated Use essentialKPIs instead
 */
export const executiveKPIs: KPIDefinition[] = [
  {
    id: "students_on_track",
    name: "Students On Track",
    formula: "(Students meeting weekly target / Total active students) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 70 },
      yellow: { min: 50, max: 69 },
      red: { max: 49 },
    },
    redAction: "Review class schedules, identify struggling teachers, check target settings",
    comparisonPeriod: "week",
  },
  {
    id: "memorization_velocity",
    name: "Memorization Velocity",
    formula: "Average pages memorized per week across all students",
    displayType: "number",
    unit: "pages/week",
    thresholds: {
      green: { min: 5.0 },
      yellow: { min: 3.0, max: 4.9 },
      red: { max: 2.9 },
    },
    redAction: "Investigate low-performing classes, review teacher engagement, check student attendance",
    comparisonPeriod: "month",
  },
  {
    id: "institutional_accuracy",
    name: "Institutional Accuracy Rate",
    formula: "Average accuracy rate (100 - % mistakes) across all students",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 85 },
      yellow: { min: 75, max: 84 },
      red: { max: 74 },
    },
    redAction: "Review quality standards, check teacher training needs, examine revision practices",
    comparisonPeriod: "month",
  },
  {
    id: "student_retention",
    name: "Student Retention Rate",
    formula: "(Active students this month / Active students last month) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 95 },
      yellow: { min: 90, max: 94 },
      red: { max: 89 },
    },
    redAction: "Identify drop-off patterns, review at-risk students, check parent engagement",
    comparisonPeriod: "month",
  },
  {
    id: "active_alerts",
    name: "Active Alerts Count",
    formula: "Count of active alerts (critical + high severity)",
    displayType: "count",
    thresholds: {
      green: { max: 0 },
      yellow: { min: 1, max: 5 },
      red: { min: 6 },
    },
    redAction: "Review alerts panel immediately, prioritize by severity, assign interventions",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      route: "/analytics?tab=alerts",
    },
  },
  {
    id: "teacher_utilization",
    name: "Teacher Utilization Rate",
    formula: "(Total active teaching hours / Total available hours) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 70, max: 90 },
      yellow: { min: 50, max: 69 },
      red: { max: 49 },
    },
    redAction: "Rebalance teacher assignments, hire additional staff, or reduce workload",
    comparisonPeriod: "month",
  },
  {
    id: "average_student_lifetime",
    name: "Average Student Lifetime",
    formula: "Average days from enrollment to current status (or withdrawal)",
    displayType: "number",
    unit: "days",
    thresholds: {
      green: { min: 365 },
      yellow: { min: 180, max: 364 },
      red: { max: 179 },
    },
    redAction: "Investigate early drop-off causes, improve onboarding, strengthen retention programs",
    comparisonPeriod: "month",
  },
];

/**
 * Student Overview KPI definitions
 */
export const studentKPIs: KPIDefinition[] = [
  {
    id: "at_risk_count",
    name: "At-Risk Students Count",
    formula: "Count of students with atRiskCompositeScore ≥ 50",
    displayType: "count",
    thresholds: {
      green: { max: 5 },
      yellow: { min: 6, max: 15 },
      red: { min: 16 },
    },
    redAction: "Review at-risk list, assign interventions, check teacher support",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "student",
    },
  },
  {
    id: "avg_attendance",
    name: "Average Attendance Rate",
    formula: "Average of all student attendance rates",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 90 },
      yellow: { min: 80, max: 89 },
      red: { max: 79 },
    },
    redAction: "Review attendance policies, contact parents of frequently absent students",
    comparisonPeriod: "week",
  },
  {
    id: "meeting_target",
    name: "Students Meeting Weekly Target",
    formula: "(Students with pace ≥ 5 pages/week / Total students) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 70 },
      yellow: { min: 50, max: 69 },
      red: { max: 49 },
    },
    redAction: "Review target settings, identify struggling students, check teacher support",
    comparisonPeriod: "week",
  },
  {
    id: "stagnant_count",
    name: "Stagnant Students Count",
    formula: "Count of students with no progress in ≥ 7 days",
    displayType: "count",
    thresholds: {
      green: { max: 3 },
      yellow: { min: 4, max: 10 },
      red: { min: 11 },
    },
    redAction: "Contact stagnant students, review teacher engagement, check external factors",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "student",
    },
  },
  {
    id: "avg_pace",
    name: "Average Memorization Pace",
    formula: "Average pages per week across all students",
    displayType: "number",
    unit: "pages/week",
    thresholds: {
      green: { min: 5.0 },
      yellow: { min: 3.0, max: 4.9 },
      red: { max: 2.9 },
    },
    redAction: "Review class performance, check teacher effectiveness, identify systemic issues",
    comparisonPeriod: "week",
  },
  {
    id: "assignment_completion",
    name: "Assignment Completion Rate",
    formula: "(Submitted assignments / Total assigned) × 100",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 85 },
      yellow: { min: 70, max: 84 },
      red: { max: 69 },
    },
    redAction: "Review assignment difficulty, check teacher follow-up, improve communication",
    comparisonPeriod: "week",
  },
  {
    id: "dropoff_risk_count",
    name: "Drop-off Risk Count",
    formula: "Count of students with dropOffProbabilityIndicator ≥ 60",
    displayType: "count",
    thresholds: {
      green: { max: 3 },
      yellow: { min: 4, max: 8 },
      red: { min: 9 },
    },
    redAction: "Immediate intervention required, contact parents, assign mentor",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "student",
    },
  },
];

/**
 * Teacher Overview KPI definitions
 */
export const teacherKPIs: KPIDefinition[] = [
  {
    id: "teachers_with_at_risk",
    name: "Teachers with At-Risk Students",
    formula: "Count of teachers with numberOfAtRiskStudentsAssigned ≥ 5",
    displayType: "count",
    thresholds: {
      green: { max: 1 },
      yellow: { min: 2, max: 3 },
      red: { min: 4 },
    },
    redAction: "Review teacher workload, provide additional support, consider reassignment",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "teacher",
    },
  },
  {
    id: "avg_student_pace",
    name: "Average Student Pace Under Teachers",
    formula: "Average of all teachers' averageStudentMemorizationPace",
    displayType: "number",
    unit: "pages/week",
    thresholds: {
      green: { min: 5.0 },
      yellow: { min: 3.0, max: 4.9 },
      red: { max: 2.9 },
    },
    redAction: "Identify underperforming teachers, provide training, review teaching methods",
    comparisonPeriod: "month",
  },
  {
    id: "session_completion",
    name: "Session Completion Rate",
    formula: "Average of (sessionsConducted / sessionsScheduled) × 100 across all teachers",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 90 },
      yellow: { min: 80, max: 89 },
      red: { max: 79 },
    },
    redAction: "Review attendance policies, address cancellation patterns, check scheduling",
    comparisonPeriod: "month",
  },
  {
    id: "teachers_missing_sessions",
    name: "Teachers Missing Sessions",
    formula: "Count of teachers with missedOrLateSessions ≥ 3",
    displayType: "count",
    thresholds: {
      green: { max: 0 },
      yellow: { min: 1, max: 2 },
      red: { min: 3 },
    },
    redAction: "Address attendance issues, review policies, provide support",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "teacher",
    },
  },
  {
    id: "grading_timeliness",
    name: "Average Grading Timeliness",
    formula: "Average of all teachers' feedbackGradingTimeliness scores",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 80 },
      yellow: { min: 60, max: 79 },
      red: { max: 59 },
    },
    redAction: "Review grading workload, provide tools/training, set clear expectations",
    comparisonPeriod: "month",
  },
  {
    id: "student_retention_teachers",
    name: "Student Retention Under Teachers",
    formula: "Average of all teachers' studentRetentionRate",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 95 },
      yellow: { min: 90, max: 94 },
      red: { max: 89 },
    },
    redAction: "Identify teachers with low retention, review teaching quality, provide support",
    comparisonPeriod: "month",
  },
  {
    id: "teacher_utilization_hours",
    name: "Teacher Utilization",
    formula: "Average of all teachers' activeTeachingHoursPerWeek",
    displayType: "number",
    unit: "hours/week",
    thresholds: {
      green: { min: 15, max: 25 },
      yellow: { min: 10, max: 14 },
      red: { max: 9 },
    },
    redAction: "Rebalance workload, hire additional staff, or reduce overload",
    comparisonPeriod: "month",
  },
];

/**
 * Class Overview KPI definitions
 */
export const classKPIs: KPIDefinition[] = [
  {
    id: "overcapacity_classes",
    name: "Overcapacity Classes",
    formula: "Count of classes with capacityUtilization ≥ 95%",
    displayType: "count",
    thresholds: {
      green: { max: 0 },
      yellow: { min: 1, max: 2 },
      red: { min: 3 },
    },
    redAction: "Split classes, increase capacity, or create new sections",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "class",
    },
  },
  {
    id: "avg_class_attendance",
    name: "Average Class Attendance",
    formula: "Average of all classes' classAttendanceRate",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { min: 90 },
      yellow: { min: 80, max: 89 },
      red: { max: 79 },
    },
    redAction: "Review attendance policies, contact parents, check scheduling conflicts",
    comparisonPeriod: "week",
  },
  {
    id: "avg_class_progress",
    name: "Average Class Progress",
    formula: "Average of all classes' averageProgressPerClass",
    displayType: "number",
    unit: "pages",
    thresholds: {
      green: { min: 50 },
      yellow: { min: 30, max: 49 },
      red: { max: 29 },
    },
    redAction: "Review class curriculum, check teacher effectiveness, identify struggling students",
    comparisonPeriod: "month",
  },
  {
    id: "high_variance_classes",
    name: "High Variance Classes",
    formula: "Count of classes with varianceInStudentPace > 3.0",
    displayType: "count",
    thresholds: {
      green: { max: 1 },
      yellow: { min: 2, max: 3 },
      red: { min: 4 },
    },
    redAction: "Review class composition, consider ability grouping, provide differentiated support",
    comparisonPeriod: "none",
    drillDown: {
      enabled: true,
      entityType: "class",
    },
  },
  {
    id: "class_dropoff_rate",
    name: "Class Drop-off Rate",
    formula: "Average of all classes' dropOffRatePerClass",
    displayType: "percentage",
    unit: "%",
    thresholds: {
      green: { max: 4.9 },
      yellow: { min: 5, max: 10 },
      red: { min: 10.1 },
    },
    redAction: "Investigate drop-off causes, improve class engagement, review teacher quality",
    comparisonPeriod: "month",
  },
  {
    id: "total_classes",
    name: "Total Classes",
    formula: "Count of active classes",
    displayType: "count",
    thresholds: {
      green: { min: 0 },
      yellow: { min: 0 },
      red: { min: 0 },
    },
    redAction: "N/A",
    comparisonPeriod: "none",
  },
  {
    id: "avg_class_size",
    name: "Average Class Size",
    formula: "Average current_students across all classes",
    displayType: "number",
    thresholds: {
      green: { min: 10, max: 20 },
      yellow: { min: 5, max: 9 },
      red: { max: 4 },
    },
    redAction: "Optimize class sizes, merge small classes, split large classes",
    comparisonPeriod: "month",
  },
];

