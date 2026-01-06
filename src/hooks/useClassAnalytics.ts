/**
 * React Query hook for class analytics
 */

import { useQuery } from "@tanstack/react-query";
import { calculateAllClassMetrics } from "@/services/analytics/classMetrics.ts";
import type { ClassMetrics } from "@/types/analytics.ts";
import { fetchStudentAnalyticsData } from "./useStudentAnalytics.ts";

/**
 * Hook to get all class metrics
 * Now loads independently in parallel with other analytics hooks
 */
export function useClassAnalytics(timeRange?: { from: Date; to: Date }) {
  return useQuery<ClassMetrics[]>({
    queryKey: ["class-analytics", timeRange?.from?.toISOString(), timeRange?.to?.toISOString()],
    queryFn: async () => {
      console.log('[useClassAnalytics] queryFn called - fetching data independently');
      const context = await fetchStudentAnalyticsData(timeRange);
      const result = calculateAllClassMetrics(context, timeRange);
      console.log('[useClassAnalytics] Calculated metrics:', {
        hasResult: !!result,
        resultType: Array.isArray(result) ? 'array' : typeof result,
        resultLength: Array.isArray(result) ? result.length : 0
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

