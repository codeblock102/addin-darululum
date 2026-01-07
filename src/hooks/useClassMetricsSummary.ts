/**
 * Hook to fetch class metrics summary from pre-aggregated table
 * Fast load, no heavy calculations
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { startOfWeek } from "date-fns";

export interface ClassMetricsSummary {
  id: string;
  week_start: string;
  class_id: string;
  class_name: string;
  student_count: number;
  capacity: number;
  capacity_utilization: number;
  avg_progress: number;
  attendance_rate: number;
  dropoff_rate: number;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get latest class metrics summary
 * Returns pre-aggregated per-class metrics (computed weekly, not on page load)
 */
export function useClassMetricsSummary(weekStart?: string) {
  const targetWeekStart = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().split("T")[0];

  return useQuery<ClassMetricsSummary[]>({
    queryKey: ["class-metrics-summary", targetWeekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_metrics_summary")
        .select("*")
        .eq("week_start", targetWeekStart)
        .order("capacity_utilization", { ascending: false }); // Highest utilization first

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("404")) {
          console.warn("[Class Metrics] Summary table not found. Run the migration to create the table.");
          return [];
        }
        throw error;
      }

      return (data || []) as ClassMetricsSummary[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - summary updates weekly
    gcTime: 10 * 60 * 1000,
  });
}

