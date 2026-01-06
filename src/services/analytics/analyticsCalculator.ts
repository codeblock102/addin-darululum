/**
 * Core Analytics Calculator Service
 * Base calculation utilities for all metrics
 */

import { subDays, subWeeks, subMonths, startOfWeek, startOfMonth, differenceInDays, differenceInWeeks } from "date-fns";
import type { TimePeriod, AnalyticsTimeRange } from "@/types/analytics.ts";

/**
 * Get date range for a time period
 */
export function getTimeRange(period: TimePeriod, referenceDate: Date = new Date()): AnalyticsTimeRange {
  let from: Date;
  let to: Date = referenceDate;

  switch (period) {
    case "weekly":
      from = startOfWeek(subWeeks(referenceDate, 1));
      break;
    case "monthly":
      from = startOfMonth(subMonths(referenceDate, 1));
      break;
    case "lifetime":
      // Use a very old date for lifetime
      from = new Date(2000, 0, 1);
      break;
    default:
      from = startOfWeek(subWeeks(referenceDate, 1));
  }

  return { from, to, period };
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  return differenceInDays(endDate, startDate);
}

/**
 * Calculate weeks between two dates
 */
export function calculateWeeksBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  return differenceInWeeks(endDate, startDate) || 1; // Minimum 1 week to avoid division by zero
}

/**
 * Calculate average per day
 */
export function calculateAveragePerDay(total: number, days: number): number {
  if (days <= 0) return 0;
  return Math.round((total / days) * 100) / 100;
}

/**
 * Calculate average per week
 */
export function calculateAveragePerWeek(total: number, weeks: number): number {
  if (weeks <= 0) return 0;
  return Math.round((total / weeks) * 100) / 100;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Calculate variance
 */
export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Filter data by date range
 */
export function filterByDateRange<T extends { created_at?: string; date?: string }>(
  data: T[],
  from: Date,
  to: Date
): T[] {
  return data.filter((item) => {
    const dateStr = item.created_at || item.date;
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    return itemDate >= from && itemDate <= to;
  });
}

/**
 * Get data for specific time period
 */
export function getDataForPeriod<T extends { created_at?: string; date?: string }>(
  data: T[],
  period: TimePeriod,
  referenceDate: Date = new Date()
): T[] {
  const timeRange = getTimeRange(period, referenceDate);
  return filterByDateRange(data, timeRange.from, timeRange.to);
}

/**
 * Calculate consecutive streak
 */
export function calculateConsecutiveStreak(
  dates: (Date | string)[],
  isPresent: (date: Date | string) => boolean,
  reverse: boolean = false
): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates]
    .map((d) => (typeof d === "string" ? new Date(d) : d))
    .sort((a, b) => (reverse ? b.getTime() - a.getTime() : a.getTime() - b.getTime()));

  let maxStreak = 0;
  let currentStreak = 0;

  for (const date of sortedDates) {
    if (isPresent(date)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

/**
 * Calculate retention score (0-100)
 * Based on revision quality and frequency
 */
export function calculateRetentionScore(
  revisions: Array<{ memorization_quality?: string; revision_date: string | Date }>,
  recentDays: number = 30
): number {
  if (revisions.length === 0) return 0;

  const cutoffDate = subDays(new Date(), recentDays);
  const recentRevisions = revisions.filter((r) => {
    const revDate = typeof r.revision_date === "string" ? new Date(r.revision_date) : r.revision_date;
    return revDate >= cutoffDate;
  });

  if (recentRevisions.length === 0) return 0;

  const qualityScores: Record<string, number> = {
    excellent: 5,
    good: 4,
    average: 3,
    needsWork: 2,
    horrible: 1,
  };

  const totalScore = recentRevisions.reduce((sum, r) => {
    const quality = r.memorization_quality || "average";
    return sum + (qualityScores[quality] || 3);
  }, 0);

  const averageScore = totalScore / recentRevisions.length;
  return Math.round((averageScore / 5) * 100);
}

/**
 * Calculate consistency score (0-100)
 * Based on regularity of practice/attendance
 */
export function calculateConsistencyScore(
  dates: (Date | string)[],
  expectedFrequency: number = 5, // Expected days per week
  periodDays: number = 30
): number {
  if (dates.length === 0) return 0;

  const uniqueDays = new Set(
    dates.map((d) => {
      const date = typeof d === "string" ? new Date(d) : d;
      return date.toISOString().slice(0, 10);
    })
  );

  const actualFrequency = uniqueDays.size;
  const expectedTotal = Math.floor((expectedFrequency / 7) * periodDays);

  if (expectedTotal === 0) return 0;
  return Math.min(100, Math.round((actualFrequency / expectedTotal) * 100));
}

/**
 * Calculate composite risk score (0-100)
 * Higher score = higher risk
 */
export function calculateCompositeRiskScore(factors: {
  attendanceRate?: number;
  paceScore?: number; // Lower pace = higher risk
  accuracyScore?: number; // Lower accuracy = higher risk
  consistencyScore?: number; // Lower consistency = higher risk
  stagnationDays?: number;
}): number {
  const weights = {
    attendance: 0.25,
    pace: 0.25,
    accuracy: 0.20,
    consistency: 0.15,
    stagnation: 0.15,
  };

  let riskScore = 0;

  // Attendance risk (lower attendance = higher risk)
  if (factors.attendanceRate !== undefined) {
    riskScore += (100 - factors.attendanceRate) * weights.attendance;
  }

  // Pace risk (lower pace = higher risk, normalize pace to 0-100)
  if (factors.paceScore !== undefined) {
    riskScore += (100 - Math.min(100, factors.paceScore * 10)) * weights.pace;
  }

  // Accuracy risk (lower accuracy = higher risk)
  if (factors.accuracyScore !== undefined) {
    riskScore += (100 - factors.accuracyScore) * weights.accuracy;
  }

  // Consistency risk (lower consistency = higher risk)
  if (factors.consistencyScore !== undefined) {
    riskScore += (100 - factors.consistencyScore) * weights.consistency;
  }

  // Stagnation risk (more days = higher risk, max at 30 days)
  if (factors.stagnationDays !== undefined) {
    const stagnationRisk = Math.min(100, (factors.stagnationDays / 30) * 100);
    riskScore += stagnationRisk * weights.stagnation;
  }

  return Math.min(100, Math.round(riskScore));
}

/**
 * Calculate drop-off probability (0-100)
 * Based on multiple risk factors
 */
export function calculateDropOffProbability(riskScore: number, additionalFactors?: {
  consecutiveAbsences?: number;
  recentDecline?: boolean;
  lowEngagement?: boolean;
}): number {
  let probability = riskScore;

  // Adjust based on additional factors
  if (additionalFactors) {
    if (additionalFactors.consecutiveAbsences && additionalFactors.consecutiveAbsences >= 5) {
      probability += 20;
    }
    if (additionalFactors.recentDecline) {
      probability += 15;
    }
    if (additionalFactors.lowEngagement) {
      probability += 10;
    }
  }

  return Math.min(100, Math.round(probability));
}

/**
 * Check if student is stagnant (no progress in X days)
 */
export function checkStagnation(
  lastProgressDate: Date | string | null | undefined,
  thresholdDays: number = 7
): { isStagnant: boolean; daysSinceLastProgress: number } {
  if (!lastProgressDate) {
    return { isStagnant: true, daysSinceLastProgress: 999 };
  }

  const lastDate = typeof lastProgressDate === "string" ? new Date(lastProgressDate) : lastProgressDate;
  const daysSince = calculateDaysBetween(lastDate, new Date());
  
  return {
    isStagnant: daysSince >= thresholdDays,
    daysSinceLastProgress: daysSince,
  };
}

/**
 * Calculate Juz completion percentage
 */
export function calculateJuzCompletion(currentJuz: number, completedJuz: number[]): {
  currentJuzPercentage: number;
  totalHifzGoalPercentage: number;
} {
  const totalJuz = 30; // Total Juz in Quran
  const totalHifzGoalPercentage = calculatePercentage(completedJuz.length, totalJuz);
  
  // For current Juz, we estimate based on progress within the Juz
  // This is a simplified calculation - in reality, you'd need more detailed progress tracking
  const currentJuzPercentage = currentJuz > 0 && currentJuz <= totalJuz ? 50 : 0; // Placeholder
  
  return {
    currentJuzPercentage,
    totalHifzGoalPercentage,
  };
}

