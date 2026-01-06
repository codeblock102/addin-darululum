/**
 * Hook to fetch analytics alerts from pre-computed table
 * Fast load, no real-time calculations
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import type { AnalyticsAlert } from "@/types/analytics.ts";

/**
 * Hook to get active analytics alerts from summary table
 * Returns pre-computed alerts (generated daily, not on page load)
 */
export function useAnalyticsAlertsSummary(date?: string, status: "active" | "all" = "active") {
  const targetDate = date || new Date().toISOString().split("T")[0];

  return useQuery<AnalyticsAlert[]>({
    queryKey: ["analytics-alerts-summary", targetDate, status],
    queryFn: async () => {
      let query = supabase
        .from("analytics_alerts")
        .select("*")
        .eq("date", targetDate)
        .order("severity", { ascending: false }) // Critical first
        .order("created_at", { ascending: false });

      if (status === "active") {
        query = query.eq("status", "active");
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("404")) {
          console.warn("[Analytics Alerts] Summary table not found. Run the migration to create the table.");
          return [];
        }
        throw error;
      }

      // Convert database format to AnalyticsAlert format
      return (data || []).map((row: any): AnalyticsAlert => ({
        id: row.id,
        type: row.type as AnalyticsAlert["type"],
        severity: row.severity as AnalyticsAlert["severity"],
        status: row.status as AnalyticsAlert["status"],
        title: row.title,
        description: row.description,
        entityId: row.entity_id,
        entityName: row.entity_name,
        entityType: row.entity_type as AnalyticsAlert["entityType"],
        threshold: row.threshold,
        currentValue: row.current_value,
        createdAt: row.created_at,
        acknowledgedAt: row.acknowledged_at || undefined,
        resolvedAt: row.resolved_at || undefined,
        metadata: row.metadata || {},
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for alerts (more frequent updates)
    gcTime: 5 * 60 * 1000,
  });
}

