/**
 * React Query hook for analytics alerts
 */

import { useQuery } from "@tanstack/react-query";
import { generateAllAlerts } from "@/services/analytics/alertEngine.ts";
import type { AnalyticsAlert } from "@/types/analytics.ts";
import { fetchStudentAnalyticsData } from "./useStudentAnalytics.ts";

/**
 * Hook to get all analytics alerts
 * Now loads independently in parallel with other analytics hooks
 */
export function useAnalyticsAlerts(timeRange?: { from: Date; to: Date }) {
  return useQuery<AnalyticsAlert[]>({
    queryKey: ["analytics-alerts", timeRange?.from?.toISOString(), timeRange?.to?.toISOString()],
    queryFn: async () => {
      console.log('[useAnalyticsAlerts] queryFn called - fetching data independently');
      const context = await fetchStudentAnalyticsData(timeRange);
      return generateAllAlerts(context, timeRange);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for alerts (more frequent updates)
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

/**
 * Hook to get active alerts only
 */
export function useActiveAlerts(timeRange?: { from: Date; to: Date }) {
  const { data: allAlerts, isLoading } = useAnalyticsAlerts(timeRange);

  return {
    data: allAlerts?.filter((a) => a.status === "active") || [],
    isLoading,
  };
}

/**
 * Hook to get alerts by type
 */
export function useAlertsByType(
  alertType: AnalyticsAlert["type"],
  timeRange?: { from: Date; to: Date }
) {
  const { data: allAlerts, isLoading } = useAnalyticsAlerts(timeRange);

  return {
    data: allAlerts?.filter((a) => a.type === alertType && a.status === "active") || [],
    isLoading,
  };
}

