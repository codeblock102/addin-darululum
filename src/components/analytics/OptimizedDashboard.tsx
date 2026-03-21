/**
 * Analytics Overview Dashboard
 * Shows 6 institution-level KPIs computed live from real data.
 * Answers the question: "Is our madrassah healthy right now?"
 *
 * Metrics shown:
 *  1. Active Students        – total enrolled students
 *  2. Students On Track      – attending ≥80% AND progressing in last 7 days
 *  3. Memorization Velocity  – avg pages/week across all students (last 30 days)
 *  4. Attendance Rate        – avg attendance across all students (last 30 days)
 *  5. At-Risk Students       – attendance <70% OR no progress in 14+ days
 *  6. Stagnant Students      – no progress recorded in last 7 days
 */

import { useAnalyticsLive } from "@/hooks/useAnalyticsLive.ts";
import { KPICard } from "./KPICard.tsx";
import { calculateThresholdStatus } from "@/types/dashboard.ts";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";

export function OptimizedDashboard() {
  const { data, isLoading, error, refetch } = useAnalyticsLive();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading live analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load analytics</p>
          <p className="text-sm text-gray-600 mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.overview.totalActiveStudents === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <BookOpen className="h-12 w-12 text-gray-400" />
        <div>
          <p className="font-semibold text-gray-900 text-lg">No active students found</p>
          <p className="text-sm text-gray-600 mt-1 max-w-sm">
            Add students to your madrassah to start seeing analytics here.
          </p>
        </div>
      </div>
    );
  }

  const { overview } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Institution Health Overview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Live data · Last 30 days · Updated{" "}
            {new Date(overview.computedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Active Students */}
        <KPICard
          definition={{
            id: "active_students",
            name: "Active Students",
            formula: "COUNT(students WHERE status='active')",
            displayType: "count",
            thresholds: { green: { min: 1 }, yellow: { min: 0 }, red: { max: -1 } },
            redAction: "No active students — check enrollment",
            comparisonPeriod: "none",
          }}
          value={overview.totalActiveStudents}
          status="green"
          icon={<Users className="h-5 w-5" />}
        />

        {/* 2. Students On Track */}
        <KPICard
          definition={{
            id: "students_on_track",
            name: "Students On Track",
            formula: "Attendance ≥80% AND progress in last 7 days",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 70 },
              yellow: { min: 50, max: 69 },
              red: { max: 49 },
            },
            redAction: "More than half of students are behind — review teaching pace and attendance",
            comparisonPeriod: "week",
          }}
          value={overview.studentsOnTrackPercentage}
          status={calculateThresholdStatus(overview.studentsOnTrackPercentage, {
            green: { min: 70 },
            yellow: { min: 50, max: 69 },
            red: { max: 49 },
          })}
          icon={<CheckCircle className="h-5 w-5" />}
        />

        {/* 3. Memorization Velocity */}
        <KPICard
          definition={{
            id: "memorization_velocity",
            name: "Memorization Pace",
            formula: "Average pages memorized per week (last 30 days)",
            displayType: "number",
            unit: "pages/week",
            thresholds: {
              green: { min: 5 },
              yellow: { min: 3, max: 4.9 },
              red: { max: 2.9 },
            },
            redAction: "Students are memorizing less than 3 pages/week — review teaching methods",
            comparisonPeriod: "week",
          }}
          value={overview.avgMemorizationVelocity}
          status={calculateThresholdStatus(overview.avgMemorizationVelocity, {
            green: { min: 5 },
            yellow: { min: 3, max: 4.9 },
            red: { max: 2.9 },
          })}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        {/* 4. Attendance Rate */}
        <KPICard
          definition={{
            id: "attendance_rate",
            name: "Attendance Rate",
            formula: "% of sessions marked present or late (last 30 days)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 75, max: 89 },
              red: { max: 74 },
            },
            redAction: "Attendance is critically low — contact parents and review scheduling",
            comparisonPeriod: "week",
          }}
          value={overview.overallAttendanceRate}
          status={calculateThresholdStatus(overview.overallAttendanceRate, {
            green: { min: 90 },
            yellow: { min: 75, max: 89 },
            red: { max: 74 },
          })}
          icon={<Users className="h-5 w-5" />}
        />

        {/* 5. At-Risk Students */}
        <KPICard
          definition={{
            id: "at_risk_students",
            name: "At-Risk Students",
            formula: "Attendance <70% OR no progress logged in 14+ days",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { max: 10 },
              yellow: { min: 11, max: 20 },
              red: { min: 21 },
            },
            redAction: "Over 20% of students at risk — immediate intervention needed",
            comparisonPeriod: "none",
          }}
          value={overview.atRiskPercentage}
          status={calculateThresholdStatus(overview.atRiskPercentage, {
            green: { max: 10 },
            yellow: { min: 11, max: 20 },
            red: { min: 21 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        {/* 6. Stagnant Students */}
        <KPICard
          definition={{
            id: "stagnant_students",
            name: "Stagnant Students",
            formula: "No progress recorded in the last 7 days",
            displayType: "count",
            thresholds: {
              green: { max: 2 },
              yellow: { min: 3, max: 5 },
              red: { min: 6 },
            },
            redAction: "6+ students with no recent progress — check with their teachers",
            comparisonPeriod: "none",
          }}
          value={overview.stagnantCount}
          status={calculateThresholdStatus(overview.stagnantCount, {
            green: { max: 2 },
            yellow: { min: 3, max: 5 },
            red: { min: 6 },
          })}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Quick summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gray-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Active Students</p>
            <p className="text-xl font-bold text-gray-900">{overview.totalActiveStudents}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Active Teachers</p>
            <p className="text-xl font-bold text-gray-900">{overview.totalActiveTeachers}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Students On Track</p>
            <p className="text-xl font-bold text-gray-900">
              {overview.studentsOnTrackCount}{" "}
              <span className="text-sm font-normal text-gray-500">
                / {overview.totalActiveStudents}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-50">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-gray-500">Need Attention</p>
            <p className="text-xl font-bold text-red-600">{overview.atRiskCount}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
