/**
 * Teacher Student Insights
 *
 * Per-student metrics table for the teacher portal "My Students" / "Performance" tab.
 * Shows attendance rate, memorization pace, days since last progress, juz progress,
 * and at-risk / stagnant badges for each of the teacher's assigned students.
 *
 * Data powered by useTeacherStudentMetrics().
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  AlertTriangle,
  Clock,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  useTeacherStudentMetrics,
  type TeacherStudentMetric,
} from "@/hooks/useTeacherStudentMetrics.ts";

// ── Summary KPI card ────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: "red" | "yellow" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        highlight === "red" && "border-red-200 bg-red-50",
        highlight === "yellow" && "border-yellow-200 bg-yellow-50",
        highlight === "green" && "border-emerald-200 bg-emerald-50",
        !highlight && "bg-white",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          highlight === "red" && "text-red-700",
          highlight === "yellow" && "text-yellow-700",
          highlight === "green" && "text-emerald-700",
          !highlight && "text-gray-900",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Single student row ──────────────────────────────────────────────────────
function StudentRow({ student }: { student: TeacherStudentMetric }) {
  const navigate = useNavigate();

  const attendanceColor =
    student.attendanceRate === null
      ? "text-gray-400"
      : student.attendanceRate < 70
      ? "text-red-600 font-semibold"
      : student.attendanceRate < 85
      ? "text-yellow-600"
      : "text-emerald-600";

  const daysColor =
    student.daysSinceProgress >= 14
      ? "text-red-600 font-semibold"
      : student.daysSinceProgress >= 7
      ? "text-yellow-600"
      : "text-emerald-600";

  return (
    <tr
      className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/students/${student.id}`)}
    >
      {/* Name + badges */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900">
            {student.name}
          </span>
          {student.isAtRisk && (
            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
              At Risk
            </Badge>
          )}
          {!student.isAtRisk && student.isStagnant && (
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 h-4 border-yellow-400 text-yellow-700 bg-yellow-50"
            >
              Stagnant
            </Badge>
          )}
        </div>
        {student.section && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {student.section}
          </p>
        )}
      </td>

      {/* Attendance */}
      <td className={cn("px-4 py-3 text-sm tabular-nums", attendanceColor)}>
        {student.attendanceRate !== null
          ? `${Math.round(student.attendanceRate)}%`
          : "—"}
      </td>

      {/* Pace */}
      <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
        {student.pacePerWeek > 0 ? `${student.pacePerWeek} pg/wk` : "—"}
      </td>

      {/* Days since progress */}
      <td className={cn("px-4 py-3 text-sm tabular-nums", daysColor)}>
        {student.daysSinceProgress === 999
          ? "Never"
          : `${student.daysSinceProgress}d`}
      </td>

      {/* Juz progress */}
      <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">
        {student.completedJuz > 0
          ? `${student.completedJuz} juz`
          : student.currentJuz
          ? `Juz ${student.currentJuz}`
          : "—"}
      </td>

      {/* Pages last 30d */}
      <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
        {student.totalPagesLast30Days > 0
          ? `${student.totalPagesLast30Days} pg`
          : "—"}
      </td>
    </tr>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export function TeacherStudentInsights({ teacherId }: { teacherId: string }) {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useTeacherStudentMetrics(teacherId);

  const filtered =
    data?.students.filter((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="py-6 text-center text-sm text-destructive">
          Failed to load student metrics.
        </CardContent>
      </Card>
    );
  }

  if (!data || data.students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          No assigned students found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI summary row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Total Students"
          value={data.students.length}
          sub="active & assigned"
        />
        <KpiCard
          label="At Risk"
          value={data.atRiskCount}
          sub="need immediate attention"
          highlight={data.atRiskCount > 0 ? "red" : undefined}
        />
        <KpiCard
          label="Avg Attendance"
          value={`${data.avgAttendanceRate}%`}
          sub="last 30 days"
          highlight={
            data.avgAttendanceRate < 70
              ? "red"
              : data.avgAttendanceRate < 85
              ? "yellow"
              : "green"
          }
        />
        <KpiCard
          label="Avg Pace"
          value={`${data.avgPacePerWeek} pg/wk`}
          sub="pages memorized / week"
          highlight={data.avgPacePerWeek >= 3 ? "green" : "yellow"}
        />
      </div>

      {/* Student table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Student Performance</CardTitle>
              <CardDescription>
                At-risk students appear first · Click a row to view full profile
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students match your search.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-2.5 text-left">Student</th>
                    <th className="px-4 py-2.5 text-left">Attendance</th>
                    <th className="px-4 py-2.5 text-left">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Pace
                      </span>
                    </th>
                    <th className="px-4 py-2.5 text-left">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Last Progress
                      </span>
                    </th>
                    <th className="px-4 py-2.5 text-left">Juz</th>
                    <th className="px-4 py-2.5 text-left">Pages (30d)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <StudentRow key={s.id} student={s} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          At Risk = attendance &lt;70% or no progress in 14+ days
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-yellow-500" />
          Stagnant = no progress in 7–13 days
        </span>
      </div>
    </div>
  );
}
