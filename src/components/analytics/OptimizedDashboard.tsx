/**
 * Optimized Analytics Dashboard - Overview Tab
 * Shows exactly 6 essential KPIs from pre-aggregated data
 * Purpose: "Is the program healthy right now?"
 * Fast load time: single query, no heavy calculations
 */

import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary.ts";
import { KPICard } from "./KPICard.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { calculateThresholdStatus } from "@/types/dashboard.ts";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { triggerAnalyticsAggregation } from "@/utils/runAnalyticsAggregation.ts";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export function OptimizedDashboard() {
  const { data: summary, isLoading, error } = useAnalyticsSummary();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load analytics</p>
          <p className="text-sm text-gray-600 mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!summary || summary.total_active_students === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          message="No analytics data available"
          description="The analytics summary table needs to be populated. Click the button below to run the aggregation job, or set up a daily scheduled job."
        />
        <div className="flex justify-center">
          <Button
            onClick={async () => {
              try {
                await triggerAnalyticsAggregation();
                // Refresh the page after a short delay
                setTimeout(() => window.location.reload(), 2000);
              } catch (error) {
                console.error("Failed to run aggregation:", error);
              }
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Run Analytics Aggregation
          </Button>
        </div>
        <div className="text-sm text-gray-500 text-center mt-4">
          <p>Note: Make sure the analytics_summary table exists in your database.</p>
          <p>Run the SQL from CREATE_ANALYTICS_TABLE.sql in your Supabase SQL Editor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Institution Health Overview</h2>
        <p className="text-sm text-gray-600 mt-1">
          Is the program healthy right now? • Updated daily • Last updated: {new Date(summary.updated_at).toLocaleDateString()}
        </p>
      </div>

      {/* KPI Cards - 6 essential metrics for Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Active Students Count */}
        <KPICard
          definition={{
            id: "active_students_count",
            name: "Active Students",
            formula: "COUNT(students WHERE status='active')",
            displayType: "count",
            thresholds: {
              green: { min: 1 },
              yellow: { min: 0 },
              red: { max: -1 },
            },
            redAction: "No active students - check enrollment",
            comparisonPeriod: "none",
          }}
          value={summary.total_active_students}
          status="green"
          icon={<Users className="h-5 w-5" />}
        />
        
        {/* 2. % Students On Track */}
        <KPICard
          definition={{
            id: "students_on_track",
            name: "Students On Track",
            formula: "(Students meeting weekly target / Total active) × 100",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 70 },
              yellow: { min: 50, max: 69 },
              red: { max: 49 },
            },
            redAction: "Review class schedules, identify struggling teachers, check target settings",
            comparisonPeriod: "week",
          }}
          value={summary.students_on_track_percentage}
          status={calculateThresholdStatus(summary.students_on_track_percentage, {
            green: { min: 70 },
            yellow: { min: 50, max: 69 },
            red: { max: 49 },
          })}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        
        {/* 3. Overall Memorization Velocity */}
        <KPICard
          definition={{
            id: "memorization_velocity",
            name: "Memorization Velocity",
            formula: "AVG(pages_per_week across all students)",
            displayType: "number",
            unit: "pages/week",
            thresholds: {
              green: { min: 5.0 },
              yellow: { min: 3.0, max: 4.9 },
              red: { max: 2.9 },
            },
            redAction: "Identify systemic issues, review teaching methods, check student engagement",
            comparisonPeriod: "week",
          }}
          value={summary.overall_memorization_velocity}
          status={calculateThresholdStatus(summary.overall_memorization_velocity, {
            green: { min: 5.0 },
            yellow: { min: 3.0, max: 4.9 },
            red: { max: 2.9 },
          })}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        
        {/* 4. Attendance Rate */}
        <KPICard
          definition={{
            id: "attendance_rate",
            name: "Attendance Rate",
            formula: "AVG(attendance_rate across all students)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 80, max: 89 },
              red: { max: 79 },
            },
            redAction: "Address attendance policies, contact absent students, review scheduling",
            comparisonPeriod: "week",
          }}
          value={summary.overall_attendance_rate}
          status={calculateThresholdStatus(summary.overall_attendance_rate, {
            green: { min: 90 },
            yellow: { min: 80, max: 89 },
            red: { max: 79 },
          })}
          icon={<Users className="h-5 w-5" />}
        />
        
        {/* 5. % Students At Risk */}
        <KPICard
          definition={{
            id: "at_risk_students",
            name: "At-Risk Students",
            formula: "(Students with atRiskScore ≥ 50 / Total active) × 100",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { max: 10 },
              yellow: { min: 11, max: 20 },
              red: { min: 21 },
            },
            redAction: "Review at-risk list immediately, assign interventions, check teacher support",
            comparisonPeriod: "none",
          }}
          value={summary.at_risk_students_percentage}
          status={calculateThresholdStatus(summary.at_risk_students_percentage, {
            green: { max: 10 },
            yellow: { min: 11, max: 20 },
            red: { min: 21 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        
        {/* 6. 30-Day Retention Rate */}
        <KPICard
          definition={{
            id: "student_retention",
            name: "30-Day Retention",
            formula: "(Active this month / Active last month) × 100",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 80, max: 89 },
              red: { max: 79 },
            },
            redAction: "Improve retention programs, investigate drop-off causes, enhance student engagement",
            comparisonPeriod: "month",
          }}
          value={summary.student_retention_30day}
          status={calculateThresholdStatus(summary.student_retention_30day, {
            green: { min: 90 },
            yellow: { min: 80, max: 89 },
            red: { max: 79 },
          })}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Active Students</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_active_students}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Active Teachers</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total_active_teachers}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Overall Attendance</p>
          <p className="text-2xl font-bold text-gray-900">{summary.overall_attendance_rate.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

