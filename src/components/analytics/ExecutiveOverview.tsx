/**
 * Executive Overview Component
 * Institution health KPIs with critical alerts banner and trend chart
 */

import { useProgramAnalytics } from "@/hooks/useProgramAnalytics.ts";
import { useAnalyticsAlerts } from "@/hooks/useAnalyticsAlerts.ts";
import { useStudentAnalytics } from "@/hooks/useStudentAnalytics.ts";
import { useTeacherAnalytics } from "@/hooks/useTeacherAnalytics.ts";
import { KPICard } from "./KPICard.tsx";
import { AlertBanner } from "./AlertBanner.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { MetricChart } from "./MetricChart.tsx";
import { executiveKPIs, calculateThresholdStatus } from "@/types/dashboard.ts";
import { calculateTrend } from "@/services/analytics/comparisonCalculator.ts";
import { useMemo } from "react";
import { subMonths, subWeeks } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Crosshair,
  AlertTriangle,
  Clock,
  GraduationCap,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";

const icons = {
  students_on_track: <Crosshair className="h-5 w-5" />,
  memorization_velocity: <TrendingUp className="h-5 w-5" />,
  institutional_accuracy: <GraduationCap className="h-5 w-5" />,
  student_retention: <Users className="h-5 w-5" />,
  active_alerts: <AlertTriangle className="h-5 w-5" />,
  teacher_utilization: <Clock className="h-5 w-5" />,
  average_student_lifetime: <BarChart3 className="h-5 w-5" />,
};

export function ExecutiveOverview() {
  const navigate = useNavigate();
  const now = new Date();
  const currentRange = { from: subMonths(now, 3), to: now };
  const previousMonthRange = { from: subMonths(now, 4), to: subMonths(now, 1) };
  const previousWeekRange = { from: subWeeks(now, 2), to: subWeeks(now, 1) };

  const { data: programMetrics, isLoading: programLoading, error: programError } = useProgramAnalytics(currentRange);
  const { data: previousMonthProgramMetrics, isLoading: prevMonthLoading } = useProgramAnalytics(previousMonthRange);
  const { data: previousWeekProgramMetrics, isLoading: prevWeekLoading } = useProgramAnalytics(previousWeekRange);
  const { data: alerts, isLoading: alertsLoading } = useAnalyticsAlerts(currentRange);
  const { data: studentMetrics, isLoading: studentLoading } = useStudentAnalytics(currentRange);
  const { data: teacherMetrics, isLoading: teacherLoading } = useTeacherAnalytics(currentRange);

  // Check if primary data is available
  const hasPrimaryData = programMetrics && studentMetrics && teacherMetrics;
  
  // Only show loading if we don't have primary data AND something is still loading
  // This allows rendering as soon as data is available, even if some queries are still loading
  const isLoading = !hasPrimaryData && (programLoading || studentLoading || teacherLoading);

  // Debug loading state transitions
  console.log('[ExecutiveOverview] Loading states:', {
    programLoading,
    studentLoading,
    teacherLoading,
    alertsLoading,
    isLoading,
    hasPrimaryData,
    hasProgramData: !!programMetrics,
    hasStudentData: !!studentMetrics,
    hasTeacherData: !!teacherMetrics,
    hasAlerts: !!alerts
  });

  // Debug logging
  console.log('[ExecutiveOverview] Data received:', {
    programMetrics: programMetrics ? 'exists' : 'null',
    programMetricsType: programMetrics ? typeof programMetrics : 'null',
    programMetricsKeys: programMetrics ? Object.keys(programMetrics) : [],
    studentMetrics: studentMetrics?.length || 0,
    studentMetricsType: studentMetrics ? Array.isArray(studentMetrics) ? 'array' : typeof studentMetrics : 'null',
    teacherMetrics: teacherMetrics?.length || 0,
    teacherMetricsType: teacherMetrics ? Array.isArray(teacherMetrics) ? 'array' : typeof teacherMetrics : 'null',
    isLoading,
    loadingStates: { programLoading, studentLoading, teacherLoading, alertsLoading },
    errors: { programError, studentError: studentMetrics ? null : 'no data', teacherError: teacherMetrics ? null : 'no data' }
  });

  const criticalAlerts = useMemo(() => {
    return alerts?.filter((a) => 
      a.status === "active" && (a.severity === "critical" || a.severity === "high")
    ) || [];
  }, [alerts]);

  // Calculate KPI values with trends
  const kpiValues = useMemo(() => {
    // Handle empty data gracefully - return empty array instead of waiting
    if (!programMetrics || !studentMetrics || !teacherMetrics) return [];

    const values: Array<{
      definition: typeof executiveKPIs[0];
      value: number;
      trend?: ReturnType<typeof calculateTrend>;
      status: ReturnType<typeof calculateThresholdStatus>;
    }> = [];

    // 1. Students On Track
    const studentsOnTrack = programMetrics.percentageStudentsOnTrackVsBehind.onTrack;
    // Use current value as fallback if previous period data is not available
    const prevStudentsOnTrack = previousWeekProgramMetrics?.percentageStudentsOnTrackVsBehind.onTrack ?? studentsOnTrack;
    const studentsOnTrackTrend = calculateTrend(studentsOnTrack, prevStudentsOnTrack, "week");
    values.push({
      definition: executiveKPIs[0],
      value: studentsOnTrack,
      trend: studentsOnTrackTrend,
      status: calculateThresholdStatus(studentsOnTrack, executiveKPIs[0].thresholds),
    });

    // 2. Memorization Velocity
    const velocity = programMetrics.overallMemorizationVelocity;
    // Use current value as fallback if previous period data is not available
    const prevVelocity = previousMonthProgramMetrics?.overallMemorizationVelocity ?? velocity;
    const velocityTrend = calculateTrend(velocity, prevVelocity, "month");
    values.push({
      definition: executiveKPIs[1],
      value: velocity,
      trend: velocityTrend,
      status: calculateThresholdStatus(velocity, executiveKPIs[1].thresholds),
    });

    // 3. Institutional Accuracy
    const accuracy = programMetrics.averageInstitutionalAccuracyRate;
    // Use current value as fallback if previous period data is not available
    const prevAccuracy = previousMonthProgramMetrics?.averageInstitutionalAccuracyRate ?? accuracy;
    const accuracyTrend = calculateTrend(accuracy, prevAccuracy, "month");
    values.push({
      definition: executiveKPIs[2],
      value: accuracy,
      trend: accuracyTrend,
      status: calculateThresholdStatus(accuracy, executiveKPIs[2].thresholds),
    });

    // 4. Student Retention
    const retention = programMetrics.monthlyStudentRetention;
    // Use current value as fallback if previous period data is not available
    const prevRetention = previousMonthProgramMetrics?.monthlyStudentRetention ?? retention;
    const retentionTrend = calculateTrend(retention, prevRetention, "month");
    values.push({
      definition: executiveKPIs[3],
      value: retention,
      trend: retentionTrend,
      status: calculateThresholdStatus(retention, executiveKPIs[3].thresholds),
    });

    // 5. Active Alerts
    const alertCount = criticalAlerts.length;
    values.push({
      definition: executiveKPIs[4],
      value: alertCount,
      status: calculateThresholdStatus(alertCount, executiveKPIs[4].thresholds),
    });

    // 6. Teacher Utilization
    const utilization = programMetrics.teacherUtilizationRate;
    // Use current value as fallback if previous period data is not available
    const prevUtilization = previousMonthProgramMetrics?.teacherUtilizationRate ?? utilization;
    const utilizationTrend = calculateTrend(utilization, prevUtilization, "month");
    values.push({
      definition: executiveKPIs[5],
      value: utilization,
      trend: utilizationTrend,
      status: calculateThresholdStatus(utilization, executiveKPIs[5].thresholds),
    });

    // 7. Average Student Lifetime
    const lifetime = programMetrics.averageStudentLifetime;
    // Use current value as fallback if previous period data is not available
    const prevLifetime = previousMonthProgramMetrics?.averageStudentLifetime ?? lifetime;
    const lifetimeTrend = calculateTrend(lifetime, prevLifetime, "month");
    values.push({
      definition: executiveKPIs[6],
      value: lifetime,
      trend: lifetimeTrend,
      status: calculateThresholdStatus(lifetime, executiveKPIs[6].thresholds),
    });

    return values;
  }, [
    programMetrics,
    previousMonthProgramMetrics,
    previousWeekProgramMetrics,
    criticalAlerts,
    studentMetrics,
    teacherMetrics,
  ]);

  // Prepare trend chart data (memorization velocity over 12 weeks)
  const trendChartData = useMemo(() => {
    // This would ideally come from historical data
    // For now, we'll create a placeholder
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekDate = subWeeks(now, i);
      weeks.push({
        week: `Week ${12 - i}`,
        velocity: programMetrics ? programMetrics.overallMemorizationVelocity + (Math.random() * 2 - 1) : 0,
      });
    }
    return weeks;
  }, [programMetrics, now]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading executive overview...</p>
      </div>
    );
  }

  // Show error state
  if (programError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load analytics data</p>
          <p className="text-sm text-gray-600 mt-1">
            {programError instanceof Error ? programError.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Ensure we have required data - handle arrays and objects properly
  const hasProgramData = programMetrics && typeof programMetrics === 'object' && Object.keys(programMetrics).length > 0;
  const hasStudentData = studentMetrics && Array.isArray(studentMetrics) && studentMetrics.length > 0;
  const hasTeacherData = teacherMetrics && Array.isArray(teacherMetrics) && teacherMetrics.length > 0;

  console.log('[ExecutiveOverview] Data checks:', {
    hasProgramData,
    hasStudentData,
    hasTeacherData,
    willRender: hasProgramData && hasStudentData && hasTeacherData
  });

  if (!hasProgramData || !hasStudentData || !hasTeacherData) {
    // Show empty state instead of null
    const missingParts = [];
    if (!hasProgramData) missingParts.push('Program metrics');
    if (!hasStudentData) missingParts.push('Student metrics');
    if (!hasTeacherData) missingParts.push('Teacher metrics');
    
    return (
      <EmptyState
        message="No data available"
        description={`Missing: ${missingParts.join(', ')}. Data may still be loading or unavailable for the selected time range.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && <AlertBanner alerts={criticalAlerts} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpiValues.map((kpi) => (
          <KPICard
            key={kpi.definition.id}
            definition={kpi.definition}
            value={kpi.value}
            trend={kpi.trend}
            status={kpi.status}
            icon={icons[kpi.definition.id as keyof typeof icons]}
            onClick={
              kpi.definition.drillDown?.enabled
                ? () => {
                    if (kpi.definition.drillDown?.route) {
                      navigate(kpi.definition.drillDown.route);
                    } else {
                      navigate(`/analytics?tab=${kpi.definition.drillDown?.entityType || "alerts"}`);
                    }
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Memorization Velocity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricChart
            title=""
            data={trendChartData}
            type="line"
            dataKey="velocity"
            xAxisKey="week"
            lines={[
              { dataKey: "velocity", name: "Pages/Week", stroke: "#2563eb" },
            ]}
            height={300}
            className="border-0 shadow-none"
          />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/analytics?tab=students")}
            >
              <Users className="h-4 w-4 mr-2" />
              View Students Overview
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/analytics?tab=teachers")}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              View Teachers Overview
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate("/analytics?tab=classes")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Classes Overview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

