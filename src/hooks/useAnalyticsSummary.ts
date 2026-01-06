/**
 * Simplified Analytics Hook
 * Fetches pre-aggregated metrics from analytics_summary table
 * Single query, fast load, no heavy calculations
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export interface AnalyticsSummary {
  id: string;
  date: string;
  institution_id: string | null;
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
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get latest analytics summary
 * Returns pre-aggregated metrics (computed daily, not on page load)
 */
export function useAnalyticsSummary() {
  return useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      // Single query: Get latest summary row
      const { data, error } = await supabase
        .from("analytics_summary")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If table doesn't exist (404) or no data found, return default values
        if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("404")) {
          console.warn("[Analytics] Summary table not found or no data available. Run the migration to create the table and aggregation job to populate data.");
          return getDefaultSummary();
        }
        throw error;
      }

      return data as AnalyticsSummary;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - summary updates daily, so this is safe
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get default summary when no data exists
 */
function getDefaultSummary(): AnalyticsSummary {
  return {
    id: "",
    date: new Date().toISOString().split("T")[0],
    institution_id: null,
    total_active_students: 0,
    students_on_track_count: 0,
    students_on_track_percentage: 0,
    at_risk_students_count: 0,
    at_risk_students_percentage: 0,
    overall_attendance_rate: 0,
    overall_memorization_velocity: 0,
    total_active_teachers: 0,
    teachers_with_at_risk_count: 0,
    teachers_with_at_risk_percentage: 0,
    avg_session_reliability: 0,
    student_retention_30day: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

