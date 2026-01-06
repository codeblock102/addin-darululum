/**
 * React Query hook for student analytics
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { calculateAllStudentMetrics } from "@/services/analytics/studentMetrics.ts";
import type { StudentMetrics, AnalyticsDataContext } from "@/types/analytics.ts";
import { subMonths } from "date-fns";

/**
 * Timeout wrapper for promises
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Fetch all data needed for student analytics
 * Exported so other hooks can use it directly for parallel loading
 */
export async function fetchStudentAnalyticsData(
  timeRange?: { from: Date; to: Date }
): Promise<AnalyticsDataContext> {
  const now = new Date();
  const from = timeRange?.from || subMonths(now, 12);
  const to = timeRange?.to || now;

  // Ensure dates are valid and from is before to
  let validFrom = from instanceof Date && !isNaN(from.getTime()) ? from : subMonths(now, 12);
  let validTo = to instanceof Date && !isNaN(to.getTime()) ? to : now;
  
  // Ensure we don't query future dates
  if (validTo > now) {
    validTo = now;
  }
  if (validFrom > now) {
    validFrom = subMonths(now, 12);
  }
  
  // Ensure from is before to
  if (validFrom >= validTo) {
    validFrom = subMonths(validTo, 1);
  }
  
  const finalFrom = validFrom;
  const finalTo = validTo;

  const fromISO = finalFrom.toISOString();
  const toISO = finalTo.toISOString();

  console.log("[Analytics] Fetching data for range:", { fromISO, toISO, finalFrom, finalTo });

  try {
    // Fetch all required data in parallel with timeout
    const [
      studentsResult,
      teachersResult,
      classesResult,
      progressResult,
      attendanceResult,
      assignmentsResult,
      submissionsResult,
      juzRevisionsResult,
      sabaqParaResult,
      communicationsResult,
    ] = await withTimeout(
      Promise.all([
    supabase
      .from("students")
      .select("id, name, section, status, enrollment_date, current_juz, completed_juz")
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id, name, section, role")
      .eq("role", "teacher"),
    supabase
      .from("classes")
      .select("id, name, capacity, current_students, teacher_ids, time_slots, days_of_week, status"),
    supabase
      .from("progress")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("attendance")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("teacher_assignments")
      .select("id, teacher_id, student_ids, created_at")
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("teacher_assignment_submissions")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
    supabase
      .from("juz_revisions")
      .select("*")
      .gte("revision_date", fromISO.split("T")[0])
      .lte("revision_date", toISO.split("T")[0]),
    supabase
      .from("sabaq_para")
      .select("*")
      .gte("revision_date", fromISO.split("T")[0])
      .lte("revision_date", toISO.split("T")[0]),
    supabase
      .from("communications")
      .select("id, sender_id, created_at")
      .gte("created_at", fromISO)
      .lte("created_at", toISO),
      ]),
      30000 // 30 second timeout
    );

    console.log("[Analytics] Data fetch completed");

    // Check for errors and log them
    // Critical queries: students, teachers, classes - these must succeed
    // Optional queries: progress, attendance, assignments, etc. - can fail gracefully
    const criticalQueries = [
      { name: "students", result: studentsResult },
      { name: "teachers", result: teachersResult },
      { name: "classes", result: classesResult },
    ];

    const optionalQueries = [
      { name: "progress", result: progressResult },
      { name: "attendance", result: attendanceResult },
      { name: "assignments", result: assignmentsResult },
      { name: "submissions", result: submissionsResult },
      { name: "juz_revisions", result: juzRevisionsResult },
      { name: "sabaq_para", result: sabaqParaResult },
      { name: "communications", result: communicationsResult },
    ];

    // Check critical queries - these must succeed
    for (const { name, result } of criticalQueries) {
      if (result.error) {
        console.error(`[Analytics] Critical query ${name} failed:`, result.error);
        throw new Error(`Failed to fetch ${name}: ${result.error.message || 'Unknown error'}`);
      }
    }

    // Log warnings for optional queries that fail, but continue
    for (const { name, result } of optionalQueries) {
      if (result.error) {
        console.warn(`[Analytics] Optional query ${name} failed (continuing with empty data):`, result.error);
      }
    }

    console.log("[Analytics] Critical queries successful, optional queries may have warnings");

    return {
      students: studentsResult.data || [],
      teachers: teachersResult.data || [],
      classes: classesResult.data || [],
      progress: progressResult.data || [],
      attendance: attendanceResult.data || [],
      assignments: assignmentsResult.data || [],
      submissions: submissionsResult.data || [],
      juzRevisions: juzRevisionsResult.data || [],
      sabaqPara: sabaqParaResult.data || [],
      communications: communicationsResult.data || [],
    };
  } catch (error) {
    console.error("[Analytics] Fatal error fetching data:", error);
    throw error;
  }
}

/**
 * Hook to get all student metrics
 */
export function useStudentAnalytics(timeRange?: { from: Date; to: Date }) {
  const query = useQuery<StudentMetrics[]>({
    queryKey: ["student-analytics", timeRange?.from?.toISOString(), timeRange?.to?.toISOString()],
    queryFn: async () => {
      console.log('[useStudentAnalytics] queryFn called');
      const context = await fetchStudentAnalyticsData(timeRange);
      const result = calculateAllStudentMetrics(context, timeRange);
      console.log('[useStudentAnalytics] Calculated metrics:', {
        hasResult: !!result,
        resultType: Array.isArray(result) ? 'array' : typeof result,
        resultLength: Array.isArray(result) ? result.length : 0
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Log hook return values
  console.log('[useStudentAnalytics] Hook return:', {
    hasData: !!query.data,
    dataType: query.data ? (Array.isArray(query.data) ? 'array' : typeof query.data) : 'null',
    dataLength: Array.isArray(query.data) ? query.data.length : 0,
    isLoading: query.isLoading,
    hasError: !!query.error
  });

  return query;
}

/**
 * Hook to get analytics data context
 */
export function useAnalyticsDataContext(timeRange?: { from: Date; to: Date }) {
  return useQuery<AnalyticsDataContext>({
    queryKey: ["analytics-data-context", timeRange?.from?.toISOString(), timeRange?.to?.toISOString()],
    queryFn: () => fetchStudentAnalyticsData(timeRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false, // Prevent infinite retries on errors
    retryOnMount: false, // Prevent retries when component remounts
  });
}

