/**
 * Utility to manually trigger analytics aggregation
 * Use this to populate the analytics_summary table
 * 
 * Usage:
 * 1. Open browser console on analytics page
 * 2. Run: window.runAnalyticsAggregation()
 * 3. Or call from a button/action in admin panel
 */

import { runDailyAnalyticsAggregation } from "@/services/analytics/aggregationJob.ts";

/**
 * Manually trigger analytics aggregation
 * This will compute and store today's metrics in the analytics_summary table
 */
export async function triggerAnalyticsAggregation(): Promise<void> {
  try {
    console.log("[Analytics] Starting manual aggregation...");
    await runDailyAnalyticsAggregation();
    console.log("[Analytics] Aggregation completed successfully!");
    alert("Analytics aggregation completed! Refresh the page to see updated metrics.");
  } catch (error) {
    console.error("[Analytics] Aggregation failed:", error);
    alert(`Analytics aggregation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
}

// Make it available globally for easy access
if (typeof window !== "undefined") {
  (window as any).runAnalyticsAggregation = triggerAnalyticsAggregation;
}

