/**
 * Class Metrics View
 * Answers: "How are our classes structured and are they effective?"
 *
 * Shows per-class data including:
 * - Capacity utilization (enrolled / max capacity)
 * - Attendance rate from attendance records (last 30 days)
 * - Status indicator
 *
 * Classes near or over capacity are flagged.
 */

import { useAnalyticsLive } from "@/hooks/useAnalyticsLive.ts";
import { KPICard } from "./KPICard.tsx";
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
  GraduationCap,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function ClassMetricsView() {
  const { data, isLoading, error } = useAnalyticsLive();

  const classes = data?.classes || [];
  const overview = data?.overview;

  const summary = useMemo(() => {
    if (classes.length === 0) {
      return {
        totalClasses: 0,
        avgCapacityUtilization: 0,
        avgAttendanceRate: 0,
        overCapacityCount: 0,
        classesWithLowAttendance: 0,
      };
    }

    const avgCapacityUtilization =
      classes.reduce((sum, c) => sum + c.capacityUtilization, 0) / classes.length;

    const classesWithAtt = classes.filter((c) => c.attendanceRate !== null);
    const avgAttendanceRate =
      classesWithAtt.length > 0
        ? classesWithAtt.reduce((sum, c) => sum + (c.attendanceRate ?? 0), 0) /
          classesWithAtt.length
        : 0;

    const overCapacityCount = classes.filter((c) => c.capacityUtilization >= 95).length;
    const classesWithLowAttendance = classesWithAtt.filter(
      (c) => (c.attendanceRate ?? 100) < 75
    ).length;

    return {
      totalClasses: classes.length,
      avgCapacityUtilization,
      avgAttendanceRate,
      overCapacityCount,
      classesWithLowAttendance,
    };
  }, [classes]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading class data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="font-semibold text-gray-900">Failed to load class data</p>
        <p className="text-sm text-gray-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="font-semibold text-gray-700">No classes found</p>
        <p className="text-sm mt-1">Create classes to see their metrics here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Class Overview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Live data · {classes.length} classes
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          definition={{
            id: "total_classes",
            name: "Total Classes",
            formula: "COUNT(all classes)",
            displayType: "count",
            thresholds: { green: { min: 1 }, yellow: { min: 0 }, red: { max: -1 } },
            redAction: "No classes found",
            comparisonPeriod: "none",
          }}
          value={summary.totalClasses}
          status="green"
          icon={<GraduationCap className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "avg_capacity",
            name: "Avg Capacity Used",
            formula: "Average (enrolled ÷ max capacity) across all classes",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 50, max: 90 },
              yellow: { min: 91, max: 94 },
              red: { min: 95 },
            },
            redAction: "Classes are near or at full capacity — consider opening new classes",
            comparisonPeriod: "none",
          }}
          value={summary.avgCapacityUtilization}
          status={calculateThresholdStatus(summary.avgCapacityUtilization, {
            green: { min: 50, max: 90 },
            yellow: { min: 91, max: 94 },
            red: { min: 95 },
          })}
          icon={<Users className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "class_attendance",
            name: "Avg Class Attendance",
            formula: "Average attendance rate across classes with records",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 75, max: 89 },
              red: { max: 74 },
            },
            redAction: "Low class attendance — review scheduling and follow up with absent students",
            comparisonPeriod: "week",
          }}
          value={summary.avgAttendanceRate}
          status={calculateThresholdStatus(summary.avgAttendanceRate, {
            green: { min: 90 },
            yellow: { min: 75, max: 89 },
            red: { max: 74 },
          })}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "overcapacity_classes",
            name: "Near-Capacity Classes",
            formula: "Classes at ≥95% capacity",
            displayType: "count",
            thresholds: { green: { max: 0 }, yellow: { min: 1, max: 2 }, red: { min: 3 } },
            redAction: "Multiple classes are overcrowded — open new classes immediately",
            comparisonPeriod: "none",
          }}
          value={summary.overCapacityCount}
          status={calculateThresholdStatus(summary.overCapacityCount, {
            green: { max: 0 },
            yellow: { min: 1, max: 2 },
            red: { min: 3 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Class Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Enrolled / Capacity</TableHead>
                  <TableHead>Capacity Used</TableHead>
                  <TableHead>Attendance (30d)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes
                  .slice()
                  .sort((a, b) => b.capacityUtilization - a.capacityUtilization)
                  .map((cls) => {
                    const isOverCapacity = cls.capacityUtilization >= 95;
                    const hasLowAttendance =
                      cls.attendanceRate !== null && cls.attendanceRate < 75;
                    const isProblematic = isOverCapacity || hasLowAttendance;

                    const capColor =
                      cls.capacityUtilization >= 95
                        ? "text-red-700 font-semibold"
                        : cls.capacityUtilization >= 80
                        ? "text-yellow-700"
                        : "text-green-700";

                    const attColor =
                      cls.attendanceRate === null
                        ? "text-gray-400"
                        : cls.attendanceRate >= 90
                        ? "text-green-700"
                        : cls.attendanceRate >= 75
                        ? "text-yellow-700"
                        : "text-red-700";

                    return (
                      <TableRow
                        key={cls.id}
                        className={isProblematic ? "bg-orange-50/40" : ""}
                      >
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>
                          {cls.currentStudents} / {cls.capacity}
                        </TableCell>
                        <TableCell>
                          <span className={capColor}>
                            {cls.capacityUtilization.toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${attColor}`}>
                            {cls.attendanceRate !== null
                              ? `${cls.attendanceRate.toFixed(0)}%`
                              : "No records"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOverCapacity ? (
                            <Badge variant="destructive">Near Capacity</Badge>
                          ) : hasLowAttendance ? (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                              Low Attendance
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-400 text-green-700">
                              Healthy
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400">
        Attendance rate is calculated from sessions recorded in the last 30 days. Classes with no attendance records show "No records".
      </p>
    </div>
  );
}
