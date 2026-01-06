/**
 * Teacher Metrics View - Performance & Load
 * Purpose: "Which teachers need support or correction?"
 * Shows 4 essential KPIs + aggregated teacher list
 * Fast load: ≤2 queries (summary + teacher list)
 */

import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary.ts";
import { useTeacherMetricsSummary } from "@/hooks/useTeacherMetricsSummary.ts";
import { KPICard } from "./KPICard.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { calculateThresholdStatus } from "@/types/dashboard.ts";
import { useMemo } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function TeacherMetricsView() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useAnalyticsSummary();
  const { data: teacherMetrics, isLoading: teacherMetricsLoading } = useTeacherMetricsSummary();
  
  const isLoading = summaryLoading || teacherMetricsLoading;
  const error = summaryError;

  // Calculate aggregated metrics from teacher list
  const aggregatedMetrics = useMemo(() => {
    if (!teacherMetrics || teacherMetrics.length === 0) {
      return {
        avgStudentProgress: 0,
        teachersAboveThreshold: 0,
        teachersAboveThresholdPercent: 0,
        avgSessionReliability: 0,
        avgStudentsPerTeacher: 0,
      };
    }

    const avgStudentProgress = teacherMetrics.length > 0
      ? teacherMetrics.reduce((sum, t) => sum + t.avg_student_pace, 0) / teacherMetrics.length
      : 0;

    const teachersAboveThreshold = teacherMetrics.filter((t) => t.at_risk_students_count >= 5).length;
    const teachersAboveThresholdPercent = teacherMetrics.length > 0
      ? (teachersAboveThreshold / teacherMetrics.length) * 100
      : 0;

    const avgSessionReliability = teacherMetrics.length > 0
      ? teacherMetrics.reduce((sum, t) => sum + t.session_reliability, 0) / teacherMetrics.length
      : 0;

    const avgStudentsPerTeacher = teacherMetrics.length > 0
      ? teacherMetrics.reduce((sum, t) => sum + t.student_count, 0) / teacherMetrics.length
      : 0;

    return {
      avgStudentProgress,
      teachersAboveThreshold,
      teachersAboveThresholdPercent,
      avgSessionReliability,
      avgStudentsPerTeacher,
    };
  }, [teacherMetrics]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading teacher metrics...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load teacher metrics</p>
          <p className="text-sm text-gray-600 mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!summary || !teacherMetrics || teacherMetrics.length === 0) {
    return (
      <EmptyState
        message="No teacher data available"
        description="Teacher metrics will be available after the weekly aggregation job runs."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teachers - Performance & Load</h2>
        <p className="text-sm text-gray-600 mt-1">
          Which teachers need support or correction? • Updated weekly
        </p>
      </div>

      {/* KPI Cards - 4 essential metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Average Student Progress per Teacher */}
        <KPICard
          definition={{
            id: "avg_student_progress",
            name: "Avg Student Progress",
            formula: "AVG(teacher.student_pace)",
            displayType: "number",
            unit: "pages/week",
            thresholds: {
              green: { min: 5.0 },
              yellow: { min: 3.0, max: 4.9 },
              red: { max: 2.9 },
            },
            redAction: "Identify underperforming teachers, provide training, review teaching methods",
            comparisonPeriod: "week",
          }}
          value={aggregatedMetrics.avgStudentProgress}
          status={calculateThresholdStatus(aggregatedMetrics.avgStudentProgress, {
            green: { min: 5.0 },
            yellow: { min: 3.0, max: 4.9 },
            red: { max: 2.9 },
          })}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        
        {/* 2. % Teachers Above At-Risk Threshold */}
        <KPICard
          definition={{
            id: "teachers_above_threshold",
            name: "Teachers Above Threshold",
            formula: "(Teachers with ≥5 at-risk students / Total teachers) × 100",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { max: 20 },
              yellow: { min: 21, max: 40 },
              red: { min: 41 },
            },
            redAction: "Identify teachers needing support, provide assistance, consider reassignment",
            comparisonPeriod: "none",
          }}
          value={aggregatedMetrics.teachersAboveThresholdPercent}
          status={calculateThresholdStatus(aggregatedMetrics.teachersAboveThresholdPercent, {
            green: { max: 20 },
            yellow: { min: 21, max: 40 },
            red: { min: 41 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        
        {/* 3. Teacher Session Reliability */}
        <KPICard
          definition={{
            id: "session_reliability",
            name: "Session Reliability",
            formula: "AVG(sessions_conducted / sessions_scheduled)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 80, max: 89 },
              red: { max: 79 },
            },
            redAction: "Address attendance/cancellation issues, review policies",
            comparisonPeriod: "week",
          }}
          value={aggregatedMetrics.avgSessionReliability}
          status={calculateThresholdStatus(aggregatedMetrics.avgSessionReliability, {
            green: { min: 90 },
            yellow: { min: 80, max: 89 },
            red: { max: 79 },
          })}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        
        {/* 4. Average Students per Teacher */}
        <KPICard
          definition={{
            id: "avg_students_per_teacher",
            name: "Avg Students/Teacher",
            formula: "AVG(teacher.student_count)",
            displayType: "number",
            thresholds: {
              green: { min: 5, max: 15 },
              yellow: { min: 16, max: 20 },
              red: { min: 21 },
            },
            redAction: "Balance workload, reassign students, hire additional teachers",
            comparisonPeriod: "none",
          }}
          value={aggregatedMetrics.avgStudentsPerTeacher}
          status={calculateThresholdStatus(aggregatedMetrics.avgStudentsPerTeacher, {
            green: { min: 5, max: 15 },
            yellow: { min: 16, max: 20 },
            red: { min: 21 },
          })}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Teacher List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Avg Pace</TableHead>
                  <TableHead>At-Risk Count</TableHead>
                  <TableHead>Session Reliability</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No teacher data available
                    </TableCell>
                  </TableRow>
                ) : (
                  teacherMetrics.map((teacher) => {
                    const isUnderperforming = 
                      teacher.avg_student_pace < 3.0 ||
                      teacher.session_reliability < 80 ||
                      teacher.at_risk_students_count >= 5;
                    
                    return (
                      <TableRow key={teacher.teacher_id}>
                        <TableCell className="font-medium">{teacher.teacher_name}</TableCell>
                        <TableCell>{teacher.student_count}</TableCell>
                        <TableCell>{teacher.avg_student_pace.toFixed(1)} pages/week</TableCell>
                        <TableCell>
                          <Badge variant={teacher.at_risk_students_count >= 5 ? "destructive" : "default"}>
                            {teacher.at_risk_students_count}
                          </Badge>
                        </TableCell>
                        <TableCell>{(teacher.session_reliability * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={isUnderperforming ? "destructive" : "default"}>
                            {isUnderperforming ? "Needs Support" : "On Track"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
