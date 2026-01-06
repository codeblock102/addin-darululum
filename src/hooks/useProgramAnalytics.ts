/**
 * React Query hook for program-level analytics
 */

import { useQuery } from "@tanstack/react-query";
import { calculateProgramMetrics } from "@/services/analytics/programMetrics.ts";
import type { ProgramMetrics } from "@/types/analytics.ts";
import { fetchStudentAnalyticsData } from "./useStudentAnalytics.ts";

/**
 * Hook to get program-level metrics
 * Now loads independently in parallel with other analytics hooks
 */
export function useProgramAnalytics(timeRange?: { from: Date; to: Date }) {
  return useQuery<ProgramMetrics>({
    queryKey: ["program-analytics", timeRange?.from?.toISOString(), timeRange?.to?.toISOString()],
    queryFn: async () => {
      console.log('[useProgramAnalytics] queryFn called - fetching data independently');
      const context = await fetchStudentAnalyticsData(timeRange);
      const result = calculateProgramMetrics(context, timeRange);
      console.log('[useProgramAnalytics] Calculated metrics:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

