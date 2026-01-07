/**
 * Class Metrics View - Capacity & Effectiveness
 * Purpose: "Which class structures are working or failing?"
 * Shows 4 essential KPIs + aggregated class list
 * Fast load: ≤2 queries (summary + class list)
 */

import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary.ts";
import { useClassMetricsSummary } from "@/hooks/useClassMetricsSummary.ts";
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
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function ClassMetricsView() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useAnalyticsSummary();
  const { data: classMetrics, isLoading: classMetricsLoading } = useClassMetricsSummary();
  
  const isLoading = summaryLoading || classMetricsLoading;
  const error = summaryError;

  // Calculate aggregated metrics from class list
  const aggregatedMetrics = useMemo(() => {
    if (!classMetrics || classMetrics.length === 0) {
      return {
        avgProgress: 0,
        avgAttendance: 0,
        avgCapacityUtilization: 0,
        avgDropoffRate: 0,
      };
    }

    const avgProgress = classMetrics.length > 0
      ? classMetrics.reduce((sum, c) => sum + c.avg_progress, 0) / classMetrics.length
      : 0;

    const avgAttendance = classMetrics.length > 0
      ? classMetrics.reduce((sum, c) => sum + c.attendance_rate, 0) / classMetrics.length
      : 0;

    const avgCapacityUtilization = classMetrics.length > 0
      ? classMetrics.reduce((sum, c) => sum + c.capacity_utilization, 0) / classMetrics.length
      : 0;

    const avgDropoffRate = classMetrics.length > 0
      ? classMetrics.reduce((sum, c) => sum + c.dropoff_rate, 0) / classMetrics.length
      : 0;

    return {
      avgProgress,
      avgAttendance,
      avgCapacityUtilization,
      avgDropoffRate,
    };
  }, [classMetrics]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading class metrics...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Failed to load class metrics</p>
          <p className="text-sm text-gray-600 mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!summary || !classMetrics || classMetrics.length === 0) {
    return (
      <EmptyState
        message="No class data available"
        description="Class metrics will be available after the weekly aggregation job runs."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Classes - Capacity & Effectiveness</h2>
        <p className="text-sm text-gray-600 mt-1">
          Which class structures are working or failing? • Updated weekly
        </p>
      </div>

      {/* KPI Cards - 4 essential metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Average Progress per Class */}
        <KPICard
          definition={{
            id: "avg_class_progress",
            name: "Avg Progress per Class",
            formula: "AVG(class.total_pages_memorized / class.student_count)",
            displayType: "number",
            unit: "pages/student",
            thresholds: {
              green: { min: 50 },
              yellow: { min: 30, max: 49 },
              red: { max: 29 },
            },
            redAction: "Identify underperforming classes, restructure if needed",
            comparisonPeriod: "month",
          }}
          value={aggregatedMetrics.avgProgress}
          status={calculateThresholdStatus(aggregatedMetrics.avgProgress, {
            green: { min: 50 },
            yellow: { min: 30, max: 49 },
            red: { max: 29 },
          })}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        
        {/* 2. Class Attendance Rate */}
        <KPICard
          definition={{
            id: "class_attendance",
            name: "Class Attendance Rate",
            formula: "AVG(class.attendance_rate)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 80, max: 89 },
              red: { max: 79 },
            },
            redAction: "Identify classes with attendance issues, review scheduling",
            comparisonPeriod: "week",
          }}
          value={aggregatedMetrics.avgAttendance}
          status={calculateThresholdStatus(aggregatedMetrics.avgAttendance, {
            green: { min: 90 },
            yellow: { min: 80, max: 89 },
            red: { max: 79 },
          })}
          icon={<Users className="h-5 w-5" />}
        />
        
        {/* 3. Capacity Utilization */}
        <KPICard
          definition={{
            id: "capacity_utilization",
            name: "Capacity Utilization",
            formula: "AVG(class.current_students / class.capacity)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 70, max: 90 },
              yellow: { min: 91, max: 95 },
              red: { min: 96 },
            },
            redAction: "Optimize class sizes, split classes, adjust capacity",
            comparisonPeriod: "none",
          }}
          value={aggregatedMetrics.avgCapacityUtilization}
          status={calculateThresholdStatus(aggregatedMetrics.avgCapacityUtilization, {
            green: { min: 70, max: 90 },
            yellow: { min: 91, max: 95 },
            red: { min: 96 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        
        {/* 4. Drop-off Rate per Class */}
        <KPICard
          definition={{
            id: "dropoff_rate",
            name: "Drop-off Rate",
            formula: "AVG(class.students_dropped / class.students_enrolled)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { max: 5 },
              yellow: { min: 6, max: 10 },
              red: { min: 11 },
            },
            redAction: "Identify problematic classes, investigate causes",
            comparisonPeriod: "month",
          }}
          value={aggregatedMetrics.avgDropoffRate}
          status={calculateThresholdStatus(aggregatedMetrics.avgDropoffRate, {
            green: { max: 5 },
            yellow: { min: 6, max: 10 },
            red: { min: 11 },
          })}
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </div>

      {/* Class List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Class Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Capacity %</TableHead>
                  <TableHead>Avg Progress</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Drop-off Rate</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classMetrics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No class data available
                    </TableCell>
                  </TableRow>
                ) : (
                  classMetrics.map((classMetric) => {
                    const isProblematic = 
                      classMetric.capacity_utilization >= 95 ||
                      classMetric.attendance_rate < 80 ||
                      classMetric.dropoff_rate >= 10;
                    
                    return (
                      <TableRow key={classMetric.class_id}>
                        <TableCell className="font-medium">{classMetric.class_name}</TableCell>
                        <TableCell>{classMetric.student_count} / {classMetric.capacity}</TableCell>
                        <TableCell>
                          <Badge variant={classMetric.capacity_utilization >= 95 ? "destructive" : "default"}>
                            {(classMetric.capacity_utilization * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{classMetric.avg_progress.toFixed(1)} pages</TableCell>
                        <TableCell>{(classMetric.attendance_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={classMetric.dropoff_rate >= 10 ? "destructive" : "default"}>
                            {(classMetric.dropoff_rate * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isProblematic ? "destructive" : "default"}>
                            {isProblematic ? "Needs Review" : "On Track"}
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
