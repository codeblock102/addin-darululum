/**
 * Hook to fetch teacher metrics summary from pre-aggregated table
 * Fast load, no heavy calculations
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { startOfWeek } from "date-fns";

export interface TeacherMetricsSummary {
  id: string;
  week_start: string;
  teacher_id: string;
  teacher_name: string;
  student_count: number;
  avg_student_pace: number;
  at_risk_students_count: number;
  session_reliability: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get latest teacher metrics summary
 * Returns pre-aggregated per-teacher metrics (computed weekly, not on page load)
 */
export function useTeacherMetricsSummary(weekStart?: string) {
  const targetWeekStart = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];

  return useQuery<TeacherMetricsSummary[]>({
    queryKey: ["teacher-metrics-summary", targetWeekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_metrics_summary")
        .select("*")
        .eq("week_start", targetWeekStart)
        .order("at_risk_students_count", { ascending: false }); // Highest at-risk count first

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("404")) {
          console.warn("[Teacher Metrics] Summary table not found. Run the migration to create the table.");
          return [];
        }
        throw error;
      }

      return (data || []) as TeacherMetricsSummary[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - summary updates weekly
    gcTime: 10 * 60 * 1000,
  });
}

