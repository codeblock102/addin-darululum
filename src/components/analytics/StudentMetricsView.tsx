/**
 * Student Metrics View
 * Answers: "Which students need attention right now?"
 *
 * Shows a live table of all active students with:
 * - Attendance rate (last 30 days)
 * - Memorization pace (pages/week)
 * - Days since last progress entry
 * - Juz progress (current + completed)
 * - Risk status
 *
 * Students are sorted: at-risk first, then by lowest attendance.
 */

import { useAnalyticsLive } from "@/hooks/useAnalyticsLive.ts";
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
import { Input } from "@/components/ui/input.tsx";
import { KPICard } from "./KPICard.tsx";
import { calculateThresholdStatus } from "@/types/dashboard.ts";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  Search,
  ExternalLink,
} from "lucide-react";

export function StudentMetricsView() {
  const { data, isLoading, error } = useAnalyticsLive();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "at-risk" | "stagnant">("all");

  const students = data?.students || [];
  const overview = data?.overview;

  const filtered = useMemo(() => {
    let list = students;
    if (filter === "at-risk") list = list.filter((s) => s.isAtRisk);
    if (filter === "stagnant") list = list.filter((s) => s.isStagnant);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.section || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, filter, search]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-gray-600">Loading student data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="font-semibold text-gray-900">Failed to load student data</p>
        <p className="text-sm text-gray-600">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  if (!overview || overview.totalActiveStudents === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="font-semibold text-gray-700">No active students</p>
        <p className="text-sm mt-1">Add students to see their progress here.</p>
      </div>
    );
  }

  const stagnantCount = overview.stagnantCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Progress & Risk</h2>
        <p className="text-sm text-gray-500 mt-1">
          Live data · Last 30 days · {overview.totalActiveStudents} active students
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          definition={{
            id: "at_risk_count",
            name: "At-Risk Students",
            formula: "Attendance <70% OR no progress in 14+ days",
            displayType: "count",
            thresholds: { green: { max: 5 }, yellow: { min: 6, max: 10 }, red: { min: 11 } },
            redAction: "Contact these students and their parents immediately",
            comparisonPeriod: "none",
          }}
          value={overview.atRiskCount}
          status={calculateThresholdStatus(overview.atRiskCount, {
            green: { max: 5 },
            yellow: { min: 6, max: 10 },
            red: { min: 11 },
          })}
          icon={<AlertTriangle className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "stagnant_count",
            name: "Stagnant Students",
            formula: "No progress recorded in last 7 days",
            displayType: "count",
            thresholds: { green: { max: 2 }, yellow: { min: 3, max: 5 }, red: { min: 6 } },
            redAction: "These students need immediate follow-up from their teacher",
            comparisonPeriod: "none",
          }}
          value={stagnantCount}
          status={calculateThresholdStatus(stagnantCount, {
            green: { max: 2 },
            yellow: { min: 3, max: 5 },
            red: { min: 6 },
          })}
          icon={<Clock className="h-5 w-5" />}
        />

        <KPICard
          definition={{
            id: "avg_pace",
            name: "Avg Memorization Pace",
            formula: "Average pages/week across all students (last 30 days)",
            displayType: "number",
            unit: "pages/week",
            thresholds: {
              green: { min: 5 },
              yellow: { min: 3, max: 4.9 },
              red: { max: 2.9 },
            },
            redAction: "Students are memorizing below target — review teaching approach",
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

        <KPICard
          definition={{
            id: "on_track",
            name: "Students On Track",
            formula: "Attendance ≥80% AND progressed in last 7 days",
            displayType: "percentage",
            unit: "%",
            thresholds: {
              green: { min: 70 },
              yellow: { min: 50, max: 69 },
              red: { max: 49 },
            },
            redAction: "Less than half of students are on track — needs urgent review",
            comparisonPeriod: "none",
          }}
          value={overview.studentsOnTrackPercentage}
          status={calculateThresholdStatus(overview.studentsOnTrackPercentage, {
            green: { min: 70 },
            yellow: { min: 50, max: 69 },
            red: { max: 49 },
          })}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 backdrop-blur-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "at-risk", "stagnant"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all"
                ? `All (${students.length})`
                : f === "at-risk"
                ? `At-Risk (${overview.atRiskCount})`
                : `Stagnant (${stagnantCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Student Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">
            {filtered.length === students.length
              ? `All Students (${filtered.length})`
              : `${filtered.length} of ${students.length} students`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Attendance (30d)</TableHead>
                  <TableHead>Pages/Week</TableHead>
                  <TableHead>Last Progress</TableHead>
                  <TableHead>Juz Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-gray-500">
                      No students match your filter
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((student) => {
                    const attColor =
                      student.attendanceRate === null
                        ? "text-gray-400"
                        : student.attendanceRate >= 90
                        ? "text-green-700"
                        : student.attendanceRate >= 75
                        ? "text-yellow-700"
                        : "text-red-700";

                    const lastProgressLabel =
                      student.daysSinceProgress === 999
                        ? "Never"
                        : student.daysSinceProgress === 0
                        ? "Today"
                        : student.daysSinceProgress === 1
                        ? "Yesterday"
                        : `${student.daysSinceProgress}d ago`;

                    const lastProgressColor =
                      student.daysSinceProgress <= 3
                        ? "text-green-700"
                        : student.daysSinceProgress <= 7
                        ? "text-yellow-700"
                        : "text-red-700";

                    return (
                      <TableRow
                        key={student.id}
                        className={student.isAtRisk ? "bg-red-50/50" : ""}
                      >
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {student.section || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${attColor}`}>
                            {student.attendanceRate !== null
                              ? `${Math.round(student.attendanceRate)}%`
                              : "No records"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={student.pacePerWeek >= 5 ? "text-green-700 font-semibold" : student.pacePerWeek >= 3 ? "text-yellow-700" : "text-red-700"}>
                            {student.pacePerWeek > 0
                              ? `${student.pacePerWeek.toFixed(1)} pg/wk`
                              : "No data"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${lastProgressColor}`}>
                            {lastProgressLabel}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.completedJuz > 0 ? (
                            <span>
                              <span className="font-semibold text-green-700">
                                {student.completedJuz}
                              </span>{" "}
                              juz done
                              {student.currentJuz ? `, on Juz ${student.currentJuz}` : ""}
                            </span>
                          ) : student.currentJuz ? (
                            `Juz ${student.currentJuz}`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.isAtRisk ? (
                            <Badge variant="destructive">At Risk</Badge>
                          ) : student.isStagnant ? (
                            <Badge variant="outline" className="border-yellow-400 text-yellow-700">
                              Stagnant
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-400 text-green-700">
                              On Track
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => navigate(`/students/${student.id}`)}
                            className="text-gray-400 hover:text-primary transition-colors"
                            title="View student profile"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Badge variant="destructive" className="text-xs">At Risk</Badge>
          Attendance &lt;70% or no progress in 14+ days
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="border-yellow-400 text-yellow-700 text-xs">Stagnant</Badge>
          No progress logged in last 7 days
        </span>
        <span className="flex items-center gap-1">
          <Badge variant="outline" className="border-green-400 text-green-700 text-xs">On Track</Badge>
          Attending regularly and making progress
        </span>
      </div>
    </div>
  );
}
