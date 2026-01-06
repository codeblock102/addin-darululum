/**
 * Program Metrics View
 * Displays all 9 program-level metrics
 */

import { useProgramAnalytics } from "@/hooks/useProgramAnalytics.ts";
import { MetricCard } from "./MetricCard.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { MetricChart } from "./MetricChart.tsx";
import { TrendingUp, Users, Target, BarChart3 } from "lucide-react";
import { subMonths } from "date-fns";

export function ProgramMetricsView() {
  const timeRange = { from: subMonths(new Date(), 12), to: new Date() };
  const { data: programMetrics, isLoading } = useProgramAnalytics(timeRange);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading program metrics...</div>;
  }

  if (!programMetrics) {
    return <div className="text-center py-12 text-gray-500">No program metrics available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Memorization Velocity"
          value={programMetrics.overallMemorizationVelocity.toFixed(1)}
          subtitle="pages/week"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Students On Track"
          value={Math.round(programMetrics.percentageStudentsOnTrackVsBehind.onTrack)}
          subtitle="%"
          status="excellent"
          icon={<Target className="h-5 w-5" />}
        />
        <MetricCard
          title="Students Behind"
          value={Math.round(programMetrics.percentageStudentsOnTrackVsBehind.behind)}
          subtitle="%"
          status={programMetrics.percentageStudentsOnTrackVsBehind.behind > 30 ? "warning" : "good"}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="Institutional Accuracy"
          value={Math.round(programMetrics.averageInstitutionalAccuracyRate)}
          subtitle="%"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      {/* Retention & Enrollment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Monthly Retention"
          value={Math.round(programMetrics.monthlyStudentRetention)}
          subtitle="%"
        />
        <MetricCard
          title="Net Enrollment Change"
          value={programMetrics.enrollmentsVsWithdrawals.netChange}
          subtitle={`${programMetrics.enrollmentsVsWithdrawals.enrollments} enrolled, ${programMetrics.enrollmentsVsWithdrawals.withdrawals} withdrawn`}
          status={programMetrics.enrollmentsVsWithdrawals.netChange >= 0 ? "good" : "warning"}
        />
      </div>

      {/* Teacher Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Teacher Turnover Rate"
          value={Math.round(programMetrics.teacherTurnoverRate)}
          subtitle="%"
          status={programMetrics.teacherTurnoverRate > 20 ? "warning" : "good"}
        />
        <MetricCard
          title="Teacher Utilization"
          value={Math.round(programMetrics.teacherUtilizationRate)}
          subtitle="%"
        />
        <MetricCard
          title="Sessions Delivered/Planned"
          value={Math.round(programMetrics.sessionsDeliveredVsPlanned.ratio)}
          subtitle={`${programMetrics.sessionsDeliveredVsPlanned.delivered} / ${programMetrics.sessionsDeliveredVsPlanned.planned}`}
          status={programMetrics.sessionsDeliveredVsPlanned.ratio >= 90 ? "good" : "warning"}
        />
      </div>

      {/* Additional Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Program Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Average Student Lifetime</p>
              <p className="text-2xl font-bold">{Math.round(programMetrics.averageStudentLifetime)} days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

