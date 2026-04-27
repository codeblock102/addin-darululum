import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useRBAC } from "@/hooks/useRBAC.ts";
import { AttendanceForm } from "@/components/attendance/AttendanceForm.tsx";
import { AttendanceTable } from "@/components/attendance/AttendanceTable.tsx";
import { AttendanceCutoffSettings } from "@/components/attendance/AttendanceCutoffSettings.tsx";
import { LongTermAbsenceModal } from "@/components/attendance/LongTermAbsenceModal.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Clock,
  Flame,
  List,
  Settings,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { AdminStatCard } from "@/components/admin/AdminPageShell.tsx";
import { StudentContactPopover } from "@/components/attendance/StudentContactPopover.tsx";
import { cn } from "@/lib/utils.ts";

// ─── Watchlist ────────────────────────────────────────────────────────────────

interface WatchlistRow {
  student_id: string;
  name: string;
  class_name: string | null;
  absence_count: number;
  streak: number;
  last_present: string | null;
  unexcused_count: number;
}

const WatchlistView = () => {
  const thirtyAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: rows = [], isLoading } = useQuery<WatchlistRow[]>({
    queryKey: ["watchlist", thirtyAgo],
    queryFn: async () => {
      // Get all absence records last 30 days
      const { data: abs } = await supabase
        .from("attendance")
        .select("student_id, date, status, late_reason")
        .gte("date", thirtyAgo)
        .lte("date", today)
        .in("status", ["absent", "sick", "excused"]);

      if (!abs || abs.length === 0) return [];

      // Group by student
      const byStudent: Record<string, { dates: string[]; statuses: string[]; reasons: (string | null)[] }> = {};
      for (const r of abs) {
        if (!byStudent[r.student_id]) byStudent[r.student_id] = { dates: [], statuses: [], reasons: [] };
        byStudent[r.student_id].dates.push(r.date);
        byStudent[r.student_id].statuses.push(r.status);
        byStudent[r.student_id].reasons.push((r as any).late_reason ?? null);
      }

      // Only keep students with 2+ absences
      const candidateIds = Object.keys(byStudent).filter(
        (id) => byStudent[id].dates.length >= 2,
      );
      if (candidateIds.length === 0) return [];

      // Fetch student names
      const { data: students } = await supabase
        .from("students")
        .select("id, name, class_name")
        .in("id", candidateIds)
        .eq("status", "active");

      if (!students) return [];

      // Get recent attendance for streak calculation
      const { data: recent } = await supabase
        .from("attendance")
        .select("student_id, date, status")
        .in("student_id", candidateIds)
        .gte("date", format(subDays(new Date(), 13), "yyyy-MM-dd"))
        .lte("date", today)
        .order("date", { ascending: false });

      // Compute streak per student (consecutive absent/sick days from latest)
      const streakMap: Record<string, number> = {};
      const lastPresentMap: Record<string, string | null> = {};

      for (const sid of candidateIds) {
        const recs = (recent ?? [])
          .filter((r) => r.student_id === sid)
          .sort((a, b) => b.date.localeCompare(a.date));

        let streak = 0;
        let lastPresent: string | null = null;
        const absentStatuses = new Set(["absent", "sick"]);

        for (const rec of recs) {
          if (absentStatuses.has(rec.status) && lastPresent === null) {
            streak++;
          } else if (!absentStatuses.has(rec.status) && lastPresent === null) {
            lastPresent = rec.date;
            break;
          }
        }
        streakMap[sid] = streak;
        lastPresentMap[sid] = lastPresent;
      }

      return students.map((s) => {
        const entry = byStudent[s.id];
        // Unexcused = absent status with no reason filed
        const unexcused = entry
          ? entry.statuses.filter(
              (st, i) => st === "absent" && !entry.reasons[i],
            ).length
          : 0;
        return {
          student_id: s.id,
          name: s.name ?? "Unknown",
          class_name: s.class_name,
          absence_count: entry?.dates.length ?? 0,
          streak: streakMap[s.id] ?? 0,
          last_present: lastPresentMap[s.id] ?? null,
          unexcused_count: unexcused,
        };
      }).sort((a, b) => b.absence_count - a.absence_count);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-green-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <UserCheck className="h-7 w-7 text-green-600" />
        </div>
        <p className="text-base font-semibold text-gray-800">All clear!</p>
        <p className="text-sm text-gray-500 mt-1">No students with 2+ absences in the last 30 days.</p>
      </div>
    );
  }

  const unexcusedStudents = rows.filter((r) => r.unexcused_count > 0);

  return (
    <div className="space-y-4">
      {/* ── Unexcused absence warning panel ── */}
      {unexcusedStudents.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-orange-800">
              {unexcusedStudents.length} student{unexcusedStudents.length !== 1 ? "s" : ""} with unexcused absences
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unexcusedStudents.map((r) => (
              <div
                key={r.student_id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-orange-200 text-xs"
              >
                <span className="font-medium text-gray-800">{r.name}</span>
                <span className="text-orange-600 font-bold">·{r.unexcused_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {rows.length} student{rows.length !== 1 ? "s" : ""} flagged · last 30 days
      </p>
      {rows.map((r) => (
        <div
          key={r.student_id}
          className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold",
                r.streak >= 3 ? "bg-red-100 text-red-700" : r.absence_count >= 5 ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700",
              )}
            >
              {r.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <StudentContactPopover
                studentId={r.student_id}
                studentName={r.name}
                status="absent"
              />
              <p className="text-xs text-gray-500">{r.class_name ?? "No class"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {r.unexcused_count > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-semibold text-orange-600">{r.unexcused_count} unexcused</span>
              </div>
            )}
            {r.streak >= 2 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded-lg">
                <Flame className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-600">{r.streak}d streak</span>
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{r.absence_count}</p>
              <p className="text-xs text-gray-500">absences</p>
            </div>
            {r.last_present && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">last seen</p>
                <p className="text-xs font-medium text-gray-600">
                  {format(parseISO(r.last_present), "MMM d")}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const HeatmapView = () => {
  const days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const thirtyAgo = format(days[0], "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: dailyRates = [], isLoading } = useQuery({
    queryKey: ["heatmap-30", thirtyAgo],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("date, status")
        .gte("date", thirtyAgo)
        .lte("date", today);

      if (!data) return [];

      // Group by date
      const map: Record<string, { total: number; present: number }> = {};
      for (const r of data) {
        if (!map[r.date]) map[r.date] = { total: 0, present: 0 };
        map[r.date].total++;
        if (["present", "late", "early_departure"].includes(r.status)) {
          map[r.date].present++;
        }
      }

      return days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        const entry = map[key];
        const rate = entry && entry.total > 0 ? Math.round((entry.present / entry.total) * 100) : null;
        return { date: key, rate, label: format(d, "EEE d"), day: format(d, "EEE"), isWeekend: [0, 6].includes(d.getDay()) };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

  const rateColor = (rate: number | null, isWeekend: boolean) => {
    if (isWeekend || rate === null) return "bg-gray-100 text-gray-300";
    if (rate >= 90) return "bg-green-500 text-white";
    if (rate >= 75) return "bg-green-300 text-green-900";
    if (rate >= 60) return "bg-amber-300 text-amber-900";
    return "bg-red-400 text-white";
  };

  if (isLoading) {
    return (
      <div className="py-16 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-green-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">30-day attendance rate</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "≥90%", cls: "bg-green-500" },
            { label: "75–89%", cls: "bg-green-300" },
            { label: "60–74%", cls: "bg-amber-300" },
            { label: "<60%", cls: "bg-red-400" },
            { label: "No data", cls: "bg-gray-100 border border-gray-200" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded-sm", l.cls)} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid — 5 rows of 6 on mobile, scrollable on small screens */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-[repeat(30,minmax(2.5rem,1fr))] gap-1.5 min-w-[600px]">
          {dailyRates.map((d) => (
            <div
              key={d.date}
              className={cn(
                "rounded-lg flex flex-col items-center justify-center aspect-square",
                rateColor(d.rate, d.isWeekend),
              )}
              title={d.isWeekend ? d.label : `${d.label}: ${d.rate !== null ? `${d.rate}%` : "No data"}`}
            >
              <span className="text-[10px] font-medium leading-none">{d.day}</span>
              <span className="text-[10px] font-bold leading-none mt-0.5">
                {d.rate !== null && !d.isWeekend ? `${d.rate}%` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(() => {
          const schoolDays = dailyRates.filter((d) => !d.isWeekend && d.rate !== null);
          const avgRate = schoolDays.length > 0
            ? Math.round(schoolDays.reduce((s, d) => s + (d.rate ?? 0), 0) / schoolDays.length)
            : 0;
          const fullDays = schoolDays.filter((d) => (d.rate ?? 0) >= 90).length;
          const lowDays = schoolDays.filter((d) => (d.rate ?? 0) < 60).length;
          const best = schoolDays.reduce((best, d) => (d.rate ?? 0) > (best.rate ?? 0) ? d : best, schoolDays[0] ?? { date: "", rate: null, label: "—", day: "", isWeekend: false });

          return [
            { label: "Avg rate (30d)", value: `${avgRate}%`, color: "text-green-700" },
            { label: "Full days (≥90%)", value: String(fullDays), color: "text-green-700" },
            { label: "Low days (<60%)", value: String(lowDays), color: lowDays > 0 ? "text-red-600" : "text-gray-500" },
            { label: "Best day", value: best ? `${best.label} · ${best.rate}%` : "—", color: "text-gray-700" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={cn("text-base font-bold mt-1", s.color)}>{s.value}</p>
            </div>
          ));
        })()}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TAB_TRIGGER = "flex items-center gap-2 py-3 px-0 text-sm font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-green-700 data-[state=active]:text-green-800 text-gray-500 bg-transparent shadow-none";

const Attendance = () => {
  const { t } = useI18n();
  const [selectedTab, setSelectedTab] = useState("take-attendance");
  const [longTermOpen, setLongTermOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isAttendanceTaker, isLoading } = useRBAC();

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin && !isAttendanceTaker) navigate("/");
  }, [isLoading, isAdmin, isAttendanceTaker, navigate]);

  const todayYmd = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgoYmd = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const { data: activeStudentsCount = 0 } = useQuery({
    queryKey: ["active-students-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count ?? 0;
    },
  });

  type TodayRow = { id: string; status: string; student_id?: string; students?: { id: string; name: string } | null };
  const { data: todayRows = [] } = useQuery<TodayRow[]>({
    queryKey: ["attendance-today", todayYmd],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("id, status, student_id, students(id, name)")
        .eq("date", todayYmd);
      return (data ?? []) as TodayRow[];
    },
  });

  type WeekRow = { id: string; status: string; date: string };
  const { data: weekRows = [] } = useQuery<WeekRow[]>({
    queryKey: ["attendance-week", sevenDaysAgoYmd, todayYmd],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("id, status, date")
        .gte("date", sevenDaysAgoYmd)
        .lte("date", todayYmd);
      return (data ?? []) as WeekRow[];
    },
  });

  const attended = new Set(["present", "late", "excused", "early_departure"]);
  const sl = (s: string) => s?.toLowerCase() ?? "";

  const attendedToday = todayRows.filter((r) => attended.has(sl(r.status))).length;
  const absentToday   = todayRows.filter((r) => sl(r.status) === "absent").length;
  const sickToday     = todayRows.filter((r) => sl(r.status) === "sick").length;
  const lateToday     = todayRows.filter((r) => sl(r.status) === "late").length;
  const weekAttended  = weekRows.filter((r) => attended.has(sl(r.status))).length;
  const weekTotal     = weekRows.length;

  const todayPct = activeStudentsCount > 0
    ? Math.round((attendedToday / activeStudentsCount) * 1000) / 10
    : 0;
  const absentPct = activeStudentsCount > 0
    ? Math.round(((absentToday + sickToday) / activeStudentsCount) * 1000) / 10
    : 0;
  const latePct = attendedToday > 0
    ? Math.round((lateToday / attendedToday) * 1000) / 10
    : 0;
  const weekPct = weekTotal > 0
    ? Math.round((weekAttended / weekTotal) * 1000) / 10
    : 0;

  const unmarked = Math.max(0, activeStudentsCount - todayRows.length);

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* ── Welcome Banner ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)" }}
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="absolute right-8 -bottom-10 w-28 h-28 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />

          <div className="relative">
            <p className="text-sm font-medium" style={{ color: "#86efac" }}>{todayLabel}</p>
            <h1 className="text-2xl font-bold text-white mt-1">Attendance Monitor</h1>
            <p className="text-green-200 text-sm mt-1">
              {unmarked > 0
                ? `${unmarked} student${unmarked !== 1 ? "s" : ""} not yet marked today`
                : todayRows.length > 0
                ? "All students marked for today"
                : "No records yet — take roll call below"}
            </p>
          </div>

          <div className="flex items-center gap-2 relative flex-wrap">
            {absentToday + sickToday > 0 && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-white text-xs font-semibold px-3 py-2 rounded-xl">
                <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                {absentToday + sickToday} absent today
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-xl h-9 w-9 p-0"
              title="Attendance settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setLongTermOpen(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Multi-day Absence
            </button>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <AdminStatCard
            label="Present Today"
            value={`${attendedToday} / ${activeStudentsCount}`}
            meta={`${todayPct.toFixed(1)}% attendance rate`}
            metaColor="text-green-700"
            icon={<UserCheck className="h-4 w-4 text-green-700" />}
            iconBg="bg-green-50"
            onClick={() => setSelectedTab("take-attendance")}
          />
          <AdminStatCard
            label="Absent / Sick"
            value={String(absentToday + sickToday)}
            meta={`${absentPct.toFixed(1)}% of enrolled`}
            metaColor={absentToday + sickToday > 0 ? "text-red-600" : "text-gray-500"}
            icon={<UserX className="h-4 w-4 text-red-600" />}
            iconBg="bg-red-50"
            onClick={() => setSelectedTab("watchlist")}
          />
          <AdminStatCard
            label="Late Today"
            value={String(lateToday)}
            meta={`${latePct.toFixed(1)}% of present`}
            metaColor={lateToday > 0 ? "text-amber-600" : "text-gray-500"}
            icon={<Clock className="h-4 w-4 text-amber-600" />}
            iconBg="bg-amber-50"
            onClick={() => setSelectedTab("records")}
          />
          <AdminStatCard
            label="7-Day Average"
            value={`${weekPct.toFixed(1)}%`}
            meta={`${weekAttended} of ${weekTotal} records`}
            metaColor="text-blue-600"
            icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
            iconBg="bg-blue-50"
            onClick={() => setSelectedTab("heatmap")}
          />
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3.5 flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 shrink-0">Today's rate</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${todayPct}%`, background: "linear-gradient(90deg, #15803d, #166534)" }}
            />
          </div>
          <span className="text-xs font-bold text-green-800 shrink-0 w-12 text-right">
            {todayPct.toFixed(1)}%
          </span>
        </div>

        {/* ── Late Arrivals Alert ──────────────────────────────────────────── */}
        {lateToday > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-amber-800">
                {lateToday} late arrival{lateToday !== 1 ? "s" : ""} today
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {todayRows
                .filter((r) => sl(r.status) === "late" && r.students)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <StudentContactPopover
                      studentId={r.students!.id}
                      studentName={r.students!.name}
                      status="late"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ── Main Card ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b border-gray-100 px-6 overflow-x-auto">
              <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none flex-nowrap">
                <TabsTrigger value="take-attendance" className={TAB_TRIGGER}>
                  <CalendarCheck className="h-4 w-4" />
                  {t("pages.attendance.tabs.take")}
                </TabsTrigger>
                <TabsTrigger value="watchlist" className={TAB_TRIGGER}>
                  <AlertTriangle className="h-4 w-4" />
                  Watchlist
                </TabsTrigger>
                <TabsTrigger value="heatmap" className={TAB_TRIGGER}>
                  <TrendingUp className="h-4 w-4" />
                  Heatmap
                </TabsTrigger>
                <TabsTrigger value="records" className={TAB_TRIGGER}>
                  <List className="h-4 w-4" />
                  {t("pages.attendance.tabs.records")}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-5 sm:p-6">
              <TabsContent value="take-attendance" className="mt-0">
                <AttendanceForm />
              </TabsContent>
              <TabsContent value="watchlist" className="mt-0">
                <WatchlistView />
              </TabsContent>
              <TabsContent value="heatmap" className="mt-0">
                <HeatmapView />
              </TabsContent>
              <TabsContent value="records" className="mt-0">
                <AttendanceTable />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <LongTermAbsenceModal open={longTermOpen} onClose={() => setLongTermOpen(false)} />
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Attendance Settings</DialogTitle>
          </DialogHeader>
          <AttendanceCutoffSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
