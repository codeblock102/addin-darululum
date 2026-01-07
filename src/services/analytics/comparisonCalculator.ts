/**
 * Comparison Calculator
 * Calculates week-over-week and month-over-month comparisons
 */

import { subWeeks, subMonths, startOfWeek, startOfMonth } from "date-fns";
import type { TrendData } from "@/types/dashboard.ts";

/**
 * Calculate trend data for a metric
 */
export function calculateTrend(
  current: number,
  previous: number,
  comparisonPeriod: "week" | "month"
): TrendData {
  if (previous === 0) {
    return {
      current,
      previous: 0,
      change: current > 0 ? 100 : 0,
      isPositive: current > 0,
    };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    current,
    previous,
    change: Math.round(change * 100) / 100,
    isPositive: change >= 0,
  };
}

/**
 * Get date range for previous period
 */
export function getPreviousPeriodRange(
  period: "week" | "month",
  referenceDate: Date = new Date()
): { from: Date; to: Date } {
  if (period === "week") {
    const thisWeekStart = startOfWeek(referenceDate);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    const lastWeekStart = startOfWeek(subWeeks(referenceDate, 1));
    return { from: lastWeekStart, to: lastWeekEnd };
  } else {
    const thisMonthStart = startOfMonth(referenceDate);
    const lastMonthEnd = new Date(thisMonthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
    const lastMonthStart = startOfMonth(subMonths(referenceDate, 1));
    return { from: lastMonthStart, to: lastMonthEnd };
  }
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

