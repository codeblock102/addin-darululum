/**
 * Teacher Metrics View
 * Answers: "Which teachers need support or recognition?"
 *
 * Shows per-teacher data including:
 * - Number of assigned students
 * - Average attendance rate of their students
 * - Average memorization pace of their students
 * - Number of at-risk students in their group
 *
 * Teachers with the most at-risk students are shown first.
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
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function TeacherMetricsView() {
  const { data, isLoading, error } = useAnalyticsLive();

  const teachers = data?.teachers || [];
  const overview = data?.overview;

  // Institution-level teacher summary metrics
  const summary = useMemo(() => {
    const activeTechersWithStudents = teachers.filter((t) => t.studentCount > 0);
    if (activeTechersWithStudents.length === 0) {
      return {
        avgStudentsPerTeacher: 0,
        avgPaceAcrossTeachers: 0,
        avgAttendanceAcrossTeachers: 0,
        teachersWithAtRisk: 0,
        teachersWithAtRiskPct: 0,
      };
    }

    const avgStudentsPerTeacher =
      activeTechersWithStudents.reduce((sum, t) => sum + t.studentCount, 0) /
      activeTechersWithStudents.length;

    const avgPaceAcrossTeachers =
      activeTechersWithStudents.reduce((sum, t) => sum + t.avgPacePerWeek, 0) /
      activeTechersWithStudents.length;

    const teachersWithAtt = activeTechersWithStudents.filter(
      (t) => t.avgAttendanceRate !== null
    );
    const avgAttendanceAcrossTeachers =
      teachersWithAtt.length > 0
        ? teachersWithAtt.reduce((sum, t) => sum + (t.avgAttendanceRate ?? 0), 0) /
          teachersWithAtt.length
        : 0;

    const teachersWithAtRisk = activeTechersWithStudents.filter(
      (t) => t.atRiskCount > 0
    ).length;
    const teachersWithAtRiskPct =
      activeTechersWithStudents.length > 0
        ? (teachersWithAtRisk / activeTechersWithStudents.length) * 100
        : 0;

    return {
      avgStudentsPerTeacher,
      avgPaceAcrossTeachers,
      avgAttendanceAcrossTeachers,
      teachersWithAtRisk,
      teachersWithAtRiskPct,
    };
  }, [teachers]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading teacher data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="font-semibold text-gray-900">Failed to load teacher data</p>
        <p className="text-sm text-gray-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!overview || teachers.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="font-semibold text-gray-700">No teachers found</p>
        <p className="text-sm mt-1">Add teacher accounts to see their performance here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Teacher Performance</h2>
        <p className="text-sm text-gray-500 mt-1">
          Live data · Last 30 days · {teachers.length} teachers
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          definition={{
            id: "avg_students_per_teacher",
            name: "Avg Students / Teacher",
            formula: "Total students assigned ÷ teachers with students",
            displayType: "number",
            thresholds: {
              green: { min: 5, max: 15 },
              yellow: { min: 16, max: 20 },
              red: { min: 21 },
            },
            redAction: "Teachers are overloaded — consider hiring or redistributing students",
            comparisonPeriod: "none",
          }}
          value={summary.avgStudentsPerTeacher}
          status={calculateThresholdStatus(summary.avgStudentsPerTeacher, {
            green: { min: 5, max: 15 },
            yellow: { min: 16, max: 20 },
            red: { min: 21 },
          })}
          icon={<Users className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "avg_student_pace",
            name: "Avg Student Pace",
            formula: "Average pages/week across all teacher groups",
            displayType: "number",
            unit: "pages/week",
            thresholds: {
              green: { min: 5 },
              yellow: { min: 3, max: 4.9 },
              red: { max: 2.9 },
            },
            redAction: "Students across all groups are memorizing slowly — provide teacher training",
            comparisonPeriod: "week",
          }}
          value={summary.avgPaceAcrossTeachers}
          status={calculateThresholdStatus(summary.avgPaceAcrossTeachers, {
            green: { min: 5 },
            yellow: { min: 3, max: 4.9 },
            red: { max: 2.9 },
          })}
          icon={<TrendingUp className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "avg_attendance_by_teacher",
            name: "Avg Student Attendance",
            formula: "Average student attendance rate across all teacher groups",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 90 },
              yellow: { min: 75, max: 89 },
              red: { max: 74 },
            },
            redAction: "Attendance is low institution-wide — investigate root cause",
            comparisonPeriod: "week",
          }}
          value={summary.avgAttendanceAcrossTeachers}
          status={calculateThresholdStatus(summary.avgAttendanceAcrossTeachers, {
            green: { min: 90 },
            yellow: { min: 75, max: 89 },
            red: { max: 74 },
          })}
          icon={<CheckCircle className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "teachers_with_at_risk",
            name: "Teachers With At-Risk Students",
            formula: "% of teachers who have ≥1 at-risk student",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { max: 20 },
              yellow: { min: 21, max: 50 },
              red: { min: 51 },
            },
            redAction: "Most teachers have at-risk students — this is a systemic issue",
            comparisonPeriod: "none",
          }}
          value={summary.teachersWithAtRiskPct}
          status={calculateThresholdStatus(summary.teachersWithAtRiskPct, {
            green: { max: 20 },
            yellow: { min: 21, max: 50 },
            red: { min: 51 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Teacher Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Avg Attendance</TableHead>
                  <TableHead>Avg Pace</TableHead>
                  <TableHead>At-Risk Students</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => {
                  const needsSupport =
                    teacher.atRiskCount >= 3 ||
                    teacher.avgPacePerWeek < 3 ||
                    (teacher.avgAttendanceRate !== null && teacher.avgAttendanceRate < 75);

                  const attColor =
                    teacher.avgAttendanceRate === null
                      ? "text-gray-400"
                      : teacher.avgAttendanceRate >= 90
                      ? "text-green-700"
                      : teacher.avgAttendanceRate >= 75
                      ? "text-yellow-700"
                      : "text-red-700";

                  return (
                    <TableRow
                      key={teacher.id}
                      className={needsSupport && teacher.studentCount > 0 ? "bg-orange-50/40" : ""}
                    >
                      <TableCell className="font-medium">
                        {teacher.name || "Unknown Teacher"}
                      </TableCell>
                      <TableCell>{teacher.studentCount}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${attColor}`}>
                          {teacher.avgAttendanceRate !== null
                            ? `${Math.round(teacher.avgAttendanceRate)}%`
                            : teacher.studentCount > 0
                            ? "No records"
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {teacher.studentCount > 0 ? (
                          <span
                            className={
                              teacher.avgPacePerWeek >= 5
                                ? "text-green-700 font-semibold"
                                : teacher.avgPacePerWeek >= 3
                                ? "text-yellow-700"
                                : "text-red-700"
                            }
                          >
                            {teacher.avgPacePerWeek > 0
                              ? `${teacher.avgPacePerWeek.toFixed(1)} pg/wk`
                              : "No data"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.studentCount > 0 ? (
                          <Badge
                            variant={teacher.atRiskCount >= 3 ? "destructive" : teacher.atRiskCount > 0 ? "outline" : "default"}
                            className={teacher.atRiskCount > 0 && teacher.atRiskCount < 3 ? "border-yellow-400 text-yellow-700" : ""}
                          >
                            {teacher.atRiskCount} student{teacher.atRiskCount !== 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No students</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {teacher.studentCount === 0 ? (
                          <Badge variant="outline" className="text-gray-400">No students</Badge>
                        ) : needsSupport ? (
                          <Badge variant="destructive">Needs Support</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-400 text-green-700">
                            On Track
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
        "Needs Support" = teacher has ≥3 at-risk students, avg pace &lt;3 pages/week, or avg student attendance &lt;75%.
      </p>
    </div>
  );
}
