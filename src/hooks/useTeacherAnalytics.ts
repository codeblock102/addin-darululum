/**
 * React Query hook for teacher analytics
 */

import { useQuery } from "@tanstack/react-query";
import { calculateAllTeacherMetrics } from "@/services/analytics/teacherMetrics.ts";
import type { TeacherMetrics } from "@/types/analytics.ts";
import { fetchStudentAnalyticsData } from "./useStudentAnalytics.ts";

/**
 * Hook to get all teacher metrics
 * Now loads independently in parallel with other analytics hooks
 */
export function useTeacherAnalytics(timeRange?: { from: Date; to: Date }) {
  return useQuery<TeacherMetrics[]>({
    queryKey: ["teacher-analytics", timeRange?.from?.toISOString(), timeRange?.to?.toISOString()],
    queryFn: async () => {
      console.log('[useTeacherAnalytics] queryFn called - fetching data independently');
      const context = await fetchStudentAnalyticsData(timeRange);
      const result = calculateAllTeacherMetrics(context, timeRange);
      console.log('[useTeacherAnalytics] Calculated metrics:', {
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

