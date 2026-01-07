/**
 * Hook to fetch student metrics summary from pre-aggregated table
 * Fast load, no heavy calculations
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export interface StudentMetricsSummary {
  id: string;
  date: string;
  student_id: string;
  student_name: string;
  at_risk_score: number;
  memorization_pace: number;
  attendance_rate: number;
  is_stagnant: boolean;
  days_since_progress: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get latest student metrics summary
 * Returns pre-aggregated per-student metrics (computed daily, not on page load)
 */
export function useStudentMetricsSummary(date?: string) {
  const targetDate = date || new Date().toISOString().split("T")[0];

  return useQuery<StudentMetricsSummary[]>({
    queryKey: ["student-metrics-summary", targetDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_metrics_summary")
        .select("*")
        .eq("date", targetDate)
        .order("at_risk_score", { ascending: false }); // Highest risk first

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("404")) {
          console.warn("[Student Metrics] Summary table not found. Run the migration to create the table.");
          return [];
        }
        throw error;
      }

      return (data || []) as StudentMetricsSummary[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - summary updates daily
    gcTime: 10 * 60 * 1000,
  });
}

