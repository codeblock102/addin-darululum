/**
 * Student Metrics View - Risk & Progress
 * Purpose: "Which students need intervention?"
 * Shows 4 essential KPIs from summary table + lazy-loaded details
 * Fast load: 1 query initially, 1 query on click for details
 */

import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary.ts";
import { useStudentMetricsSummary } from "@/hooks/useStudentMetricsSummary.ts";
import { EmptyState } from "./EmptyState.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { KPICard } from "./KPICard.tsx";
import { calculateThresholdStatus } from "@/types/dashboard.ts";
import { useState } from "react";
import { Loader2, AlertCircle, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { StudentDetailsView } from "./StudentDetailsView.tsx";

export function StudentMetricsView() {
  const [showDetails, setShowDetails] = useState(false);
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useAnalyticsSummary();
  const { data: studentMetrics, isLoading: studentMetricsLoading } = useStudentMetricsSummary();
  
  const isLoading = summaryLoading || studentMetricsLoading;
  const error = summaryError;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading student metrics...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load student metrics</p>
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
      <EmptyState
        message="No student data available"
        description="Student metrics will be available after the daily aggregation job runs."
      />
    );
  }

  // If user wants to see detailed view, show it (lazy-loaded)
  if (showDetails) {
    return <StudentDetailsView onBack={() => setShowDetails(false)} />;
  }

  // Calculate stagnation count from student metrics
  const stagnationCount = studentMetrics?.filter((s) => s.is_stagnant).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students - Risk & Progress</h2>
          <p className="text-sm text-gray-600 mt-1">
            Which students need intervention? • Updated daily
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDetails(true)}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          View Student Details
        </Button>
      </div>

      {/* KPI Cards - 4 essential metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. At-Risk Students Count */}
        <KPICard
          definition={{
            id: "at_risk_count",
            name: "At-Risk Students",
            formula: "COUNT(students WHERE atRiskScore ≥ 50)",
            displayType: "count",
            thresholds: {
              green: { max: 5 },
              yellow: { min: 6, max: 10 },
              red: { min: 11 },
            },
            redAction: "Prioritize intervention list, contact students/parents immediately",
            comparisonPeriod: "none",
          }}
          value={summary.at_risk_students_count}
          status={calculateThresholdStatus(summary.at_risk_students_count, {
            green: { max: 5 },
            yellow: { min: 6, max: 10 },
            red: { min: 11 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        
        {/* 2. At-Risk Students % */}
        <KPICard
          definition={{
            id: "at_risk_percentage",
            name: "At-Risk Students %",
            formula: "(At-risk count / Total active) × 100",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { max: 10 },
              yellow: { min: 11, max: 20 },
              red: { min: 21 },
            },
            redAction: "Gauge severity, allocate resources, review support programs",
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
        
        {/* 3. Average Student Pace */}
        <KPICard
          definition={{
            id: "avg_student_pace",
            name: "Average Student Pace",
            formula: "AVG(pages_per_week)",
            displayType: "number",
            unit: "pages/week",
            thresholds: {
              green: { min: 5.0 },
              yellow: { min: 3.0, max: 4.9 },
              red: { max: 2.9 },
            },
            redAction: "Identify if pace targets are appropriate, adjust expectations",
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
        
        {/* 4. Stagnation Count */}
        <KPICard
          definition={{
            id: "stagnation_count",
            name: "Stagnation Count",
            formula: "COUNT(students WHERE days_since_progress ≥ 7)",
            displayType: "count",
            thresholds: {
              green: { max: 2 },
              yellow: { min: 3, max: 5 },
              red: { min: 6 },
            },
            redAction: "Identify students needing immediate contact, urgent intervention",
            comparisonPeriod: "none",
          }}
          value={stagnationCount}
          status={calculateThresholdStatus(stagnationCount, {
            green: { max: 2 },
            yellow: { min: 3, max: 5 },
            red: { min: 6 },
          })}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These are aggregated metrics from the daily summary. 
          Click "View Student Details" to see per-student breakdowns, filters, and detailed tables sorted by highest risk first.
        </p>
      </Card>
    </div>
  );
}
