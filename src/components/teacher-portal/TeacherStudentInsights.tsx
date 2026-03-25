/**
 * Teacher Student Insights
 *
 * Per-student metrics for the teacher portal Performance tab.
 * — 4 KPI cards (reuses KPICard for visual consistency with admin analytics)
 * — Horizontal bar chart: pages memorized per student (last 30 days)
 * — Searchable table: attendance, pace, last progress, juz, risk badges
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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
  BookOpen,
  CheckCircle2,
  Clock,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { KPICard } from "@/components/analytics/KPICard.tsx";
import { calculateThresholdStatus } from "@/types/dashboard.ts";
import {
  useTeacherStudentMetrics,
  type TeacherStudentMetric,
} from "@/hooks/useTeacherStudentMetrics.ts";

// ── Pace bar chart ──────────────────────────────────────────────────────────
function PaceBarChart({ students }: { students: TeacherStudentMetric[] }) {
  const chartData = [...students]
    .sort((a, b) => b.totalPagesLast30Days - a.totalPagesLast30Days)
    .slice(0, 12) // show top 12 to keep it readable
    .map((s) => ({
      name: s.name.split(" ")[0], // first name only for brevity
      pages: s.totalPagesLast30Days,
      isAtRisk: s.isAtRisk,
    }));

  if (chartData.every((d) => d.pages === 0)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No memorization data logged in the last 30 days.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          unit=" pg"
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border glass-card p-2 shadow-md text-xs">
                <p className="font-semibold text-gray-800">{payload[0].payload.name}</p>
                <p className="text-emerald-700">{payload[0].value} pages in 30 days</p>
              </div>
            );
          }}
        />
        <Bar dataKey="pages" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isAtRisk ? "#f87171" : entry.pages >= 20 ? "#10b981" : "#6ee7b7"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
      className="border-b last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
      onClick={() => navigate(`/students/${student.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900">{student.name}</span>
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
          <p className="text-xs text-muted-foreground mt-0.5">{student.section}</p>
        )}
      </td>

      <td className={cn("px-4 py-3 text-sm tabular-nums", attendanceColor)}>
        {student.attendanceRate !== null ? `${Math.round(student.attendanceRate)}%` : "—"}
      </td>

      <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
        {student.pacePerWeek > 0 ? `${student.pacePerWeek} pg/wk` : "—"}
      </td>

      <td className={cn("px-4 py-3 text-sm tabular-nums", daysColor)}>
        {student.daysSinceProgress === 999 ? "Never" : `${student.daysSinceProgress}d ago`}
      </td>

      <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">
        {student.completedJuz > 0
          ? `${student.completedJuz} juz`
          : student.currentJuz
          ? `Juz ${student.currentJuz}`
          : "—"}
      </td>

      <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
        {student.totalPagesLast30Days > 0 ? `${student.totalPagesLast30Days} pg` : "—"}
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-52 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-destructive/50">
        <CardContent className="py-6 text-center text-sm text-destructive">
          Failed to load student metrics.
        </CardContent>
      </Card>
    );
  }

  if (!data || data.students.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="py-16 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">No assigned students found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Students are assigned via the student management panel.
          </p>
        </CardContent>
      </Card>
    );
  }

  const onTrackCount = data.students.filter((s) => !s.isAtRisk && !s.isStagnant).length;
  const onTrackPct = Math.round((onTrackCount / data.students.length) * 100);

  return (
    <div className="space-y-5">
      {/* ── 4 KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Total Students */}
        <KPICard
          definition={{
            id: "total_students",
            name: "Total Students",
            formula: "Active assigned students",
            displayType: "count",
            thresholds: { green: { min: 1 }, yellow: { min: 0 }, red: { max: -1 } },
            redAction: "No students assigned",
            comparisonPeriod: "none",
          }}
          value={data.students.length}
          status="green"
          icon={<Users className="h-5 w-5" />}
        />

        {/* On Track */}
        <KPICard
          definition={{
            id: "on_track",
            name: "On Track",
            formula: "Not at-risk and not stagnant",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 70 },
              yellow: { min: 50, max: 69 },
              red: { max: 49 },
            },
            redAction: "More than half of your students need attention",
            comparisonPeriod: "none",
          }}
          value={onTrackPct}
          status={calculateThresholdStatus(onTrackPct, {
            green: { min: 70 },
            yellow: { min: 50, max: 69 },
            red: { max: 49 },
          })}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        {/* Avg Attendance */}
        <KPICard
          definition={{
            id: "avg_attendance",
            name: "Avg Attendance",
            formula: "Average attendance rate across students (last 30 days)",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 85 },
              yellow: { min: 70, max: 84 },
              red: { max: 69 },
            },
            redAction: "Class attendance is critically low — contact parents",
            comparisonPeriod: "none",
          }}
          value={data.avgAttendanceRate}
          status={calculateThresholdStatus(data.avgAttendanceRate, {
            green: { min: 85 },
            yellow: { min: 70, max: 84 },
            red: { max: 69 },
          })}
          icon={<BookOpen className="h-5 w-5" />}
        />

        {/* At Risk */}
        <KPICard
          definition={{
            id: "at_risk",
            name: "At Risk",
            formula: "Attendance <70% OR no progress in 14+ days",
            displayType: "count",
            thresholds: {
              green: { max: 0 },
              yellow: { min: 1, max: 2 },
              red: { min: 3 },
            },
            redAction: "3+ students need immediate follow-up",
            comparisonPeriod: "none",
          }}
          value={data.atRiskCount}
          status={calculateThresholdStatus(data.atRiskCount, {
            green: { max: 0 },
            yellow: { min: 1, max: 2 },
            red: { min: 3 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* ── Pace bar chart ───────────────────────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Memorization Pace — Last 30 Days
              </CardTitle>
              <CardDescription className="mt-0.5">
                Pages memorized per student · red = at-risk
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Good (≥20 pg)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200" />
                Progressing
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" />
                At Risk
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <PaceBarChart students={data.students} />
        </CardContent>
      </Card>

      {/* ── Student table ────────────────────────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Student Details</CardTitle>
              <CardDescription>
                At-risk students appear first · click a row to open full profile
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
                  <tr className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
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

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          At Risk = attendance &lt;70% or no progress in 14+ days
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-yellow-500" />
          Stagnant = no progress in 7–13 days
        </span>
      </div>
    </div>
  );
}
