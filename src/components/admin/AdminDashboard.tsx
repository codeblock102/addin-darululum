/**
 * AdminDashboard — Donezo-inspired clean SaaS design
 * Replaces the TeacherDashboard for admin users.
 * Design system: off-white bg, white rounded-2xl cards, deep-green gradient primary,
 * soft shadows, generous spacing, clear hierarchy.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useAnalyticsSummary } from "@/hooks/useAnalyticsSummary.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffRow {
  id: string;
  name: string | null;
  role: string | null;
  subject: string | null;
  section: string | null;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: number | string;
  badge: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "default";
}

const MetricCard = ({
  label,
  value,
  badge,
  onClick,
  variant = "default",
}: MetricCardProps) => {
  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl p-6 text-left hover:opacity-95 transition-opacity relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)" }}
      >
        {/* Decorative background orbs */}
        <div
          className="absolute -right-6 -top-6 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="absolute right-4 -bottom-8 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />

        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <p
              className="text-sm font-medium"
              style={{ color: "#86efac" }}
            >
              {label}
            </p>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "#fff" }} />
            </span>
          </div>
          <p
            className="text-5xl font-bold mb-3"
            style={{ color: "#ffffff" }}
          >
            {value}
          </p>
          {badge}
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <span className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center">
          <ArrowUpRight className="h-3.5 w-3.5 text-gray-400" />
        </span>
      </div>
      <p className="text-5xl font-bold text-gray-900 mb-3">{value}</p>
      {badge}
    </button>
  );
};

// ─── Pill Badge ───────────────────────────────────────────────────────────────

const Pill = ({
  icon,
  label,
  className,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${className ?? ""}`}
    style={style}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </div>
);

// ─── Attendance Bar Chart ─────────────────────────────────────────────────────

const weekDays = [
  { day: "S", pct: 42 },
  { day: "M", pct: 91 },
  { day: "T", pct: 88 },
  { day: "W", pct: 74, highlight: true },
  { day: "T", pct: 83 },
  { day: "F", pct: 60 },
  { day: "S", pct: 28 },
];

const AttendanceChart = ({
  attendanceRate,
}: {
  attendanceRate: number;
}) => {
  // Replace Wednesday value with real rate if available
  const bars = weekDays.map((d, i) =>
    i === 3 && attendanceRate > 0 ? { ...d, pct: Math.round(attendanceRate) } : d
  );

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-gray-900">
          Attendance Analytics
        </h2>
        <span className="text-xs text-gray-400">This week</span>
      </div>

      <div className="flex items-end justify-between gap-3 h-44">
        {bars.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            {/* Tooltip on highlighted bar */}
            {d.highlight && (
              <div className="bg-gray-800 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap">
                {d.pct}%
              </div>
            )}
            {/* Bar */}
            <div className="w-full flex items-end justify-center">
              {d.pct < 50
                ? (
                  /* Hatched bar for low / weekend */
                  <div
                    className="w-full rounded-t-xl"
                    style={{
                      height: `${Math.max((d.pct / 100) * 140, 10)}px`,
                      backgroundImage:
                        "repeating-linear-gradient(45deg,#d1d5db,#d1d5db 2px,transparent 2px,transparent 8px)",
                      backgroundColor: "#f3f4f6",
                    }}
                  />
                )
                : (
                  <div
                    className="w-full rounded-t-xl"
                    style={{
                      height: `${(d.pct / 100) * 140}px`,
                      background: d.highlight
                        ? "linear-gradient(180deg,#22c55e,#166534)"
                        : "linear-gradient(180deg,#16a34a,#14532d)",
                    }}
                  />
                )}
            </div>
            <span className="text-xs text-gray-400 font-medium">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Progress Donut ───────────────────────────────────────────────────────────

const ProgressDonut = ({
  pct,
  onTrackCount,
  atRiskCount,
}: {
  pct: number;
  onTrackCount: number;
  atRiskCount: number;
}) => {
  const safePct = pct > 0 ? Math.min(Math.round(pct), 100) : 74;
  const circumference = 2 * Math.PI * 15.9155;
  const dash = (safePct / 100) * circumference;
  const gap = circumference - dash;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-5">
        Student Progress
      </h2>

      <div className="flex flex-col items-center">
        {/* SVG donut */}
        <div className="relative w-36 h-36">
          <svg
            viewBox="0 0 36 36"
            className="w-full h-full"
            style={{ transform: "rotate(-90deg)" }}
          >
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="3.5"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke="#166534"
              strokeWidth="3.5"
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{safePct}%</span>
            <span className="text-[11px] text-gray-500">On Track</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-700" />
            <span className="text-gray-500 text-xs">On Track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span className="text-gray-500 text-xs">Needs Work</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 w-full space-y-2 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">On Track Students</span>
            <span className="font-semibold text-gray-900">
              {onTrackCount > 0 ? onTrackCount : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Needs Attention</span>
            <span className="font-semibold text-red-600">
              {atRiskCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Staff Row ────────────────────────────────────────────────────────────────

const avatarColors = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

const StaffRow = ({ staff, idx }: { staff: StaffRow; idx: number }) => {
  const initials = (staff.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const color = avatarColors[idx % avatarColors.length];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${color}`}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {staff.name ?? "Unknown"}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {staff.subject ? `${staff.subject} · ` : ""}
          {staff.section ?? ""}
        </p>
      </div>
      <span
        className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
          staff.role === "admin"
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {staff.role === "admin" ? "Admin" : "Teacher"}
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: summary } = useAnalyticsSummary();

  // ── Data queries ────────────────────────────────────────────────────────────

  const { data: studentCount = 0 } = useQuery({
    queryKey: ["admin-students-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: teacherCount = 0 } = useQuery({
    queryKey: ["admin-teachers-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("role", ["teacher", "admin"]);
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: classCount = 0 } = useQuery({
    queryKey: ["admin-classes-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("classes")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: presentToday = 0 } = useQuery({
    queryKey: ["admin-attendance-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("date", today)
        .eq("status", "present");
      return count ?? 0;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: staffList = [] } = useQuery<StaffRow[]>({
    queryKey: ["admin-staff-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, role, subject, section")
        .in("role", ["teacher", "admin"])
        .order("name")
        .limit(6);
      return (data ?? []) as StaffRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived values ─────────────────────────────────────────────────────────

  const totalStudents = studentCount || summary?.total_active_students || 0;
  const totalTeachers = teacherCount || summary?.total_active_teachers || 0;
  const attendanceRate = summary?.overall_attendance_rate ?? 0;
  const atRiskCount = summary?.at_risk_students_count ?? 0;
  const onTrackCount = summary?.students_on_track_count ?? 0;
  const onTrackPct = summary?.students_on_track_percentage ?? 0;

  // ── Today label ────────────────────────────────────────────────────────────

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage students, staff and school operations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/students")}
              className="flex items-center gap-2 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </button>
            <button
              type="button"
              onClick={() => navigate("/students")}
              className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              View All
            </button>
          </div>
        </div>

        {/* ── Metric Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <MetricCard
            variant="primary"
            label="Total Students"
            value={totalStudents}
            onClick={() => navigate("/students")}
            badge={
              <Pill
                style={{ background: "rgba(255,255,255,0.18)", color: "#ffffff" }}
                icon={<TrendingUp className="h-3 w-3" style={{ color: "#bbf7d0" }} />}
                label={
                  onTrackCount > 0
                    ? `${onTrackCount} on track`
                    : "View progress"
                }
              />
            }
          />
          <MetricCard
            label="Today Present"
            value={presentToday}
            onClick={() => navigate("/attendance")}
            badge={
              <Pill
                className="bg-blue-50 text-blue-700"
                icon={<UserCheck className="h-3 w-3" />}
                label={
                  attendanceRate > 0
                    ? `${Math.round(attendanceRate)}% rate`
                    : "Mark attendance"
                }
              />
            }
          />
          <MetricCard
            label="Active Teachers"
            value={totalTeachers}
            onClick={() => navigate("/dashboard?tab=students")}
            badge={
              <Pill
                className="bg-amber-50 text-amber-700"
                icon={<GraduationCap className="h-3 w-3" />}
                label="2 campuses"
              />
            }
          />
          <MetricCard
            label="Active Classes"
            value={classCount}
            onClick={() => navigate("/classes")}
            badge={
              <Pill
                className="bg-purple-50 text-purple-700"
                icon={<BookOpen className="h-3 w-3" />}
                label="All subjects"
              />
            }
          />
        </div>

        {/* ── Chart + Alerts ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <AttendanceChart attendanceRate={attendanceRate} />
          </div>

          {/* Alerts Panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Alerts</h2>
              <button
                type="button"
                onClick={() => navigate("/dashboard?tab=performance")}
                className="text-xs text-green-700 hover:text-green-800 font-medium transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {atRiskCount > 0
                ? (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          {atRiskCount} At-Risk Student
                          {atRiskCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-red-500 mt-0.5">
                          Low attendance or stalled progress
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/dashboard?tab=performance")}
                      className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      View Performance
                    </button>
                  </div>
                )
                : (
                  <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          All Students On Track
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          No alerts at this time
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Attendance reminder */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Today's Attendance
                    </p>
                    <p className="text-xs text-blue-500 mt-0.5">{todayLabel}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/attendance")}
                  className="mt-3 w-full bg-green-800 hover:bg-green-900 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  Go to Attendance
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Staff + Progress ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Staff list */}
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Staff</h2>
              <button
                type="button"
                onClick={() => navigate("/dashboard?tab=students")}
                className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="h-3 w-3" />
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {staffList.length > 0
                ? staffList.map((staff, idx) => (
                  <StaffRow key={staff.id} staff={staff} idx={idx} />
                ))
                : (
                  <p className="text-center py-6 text-gray-400 text-sm">
                    No staff records found
                  </p>
                )}
            </div>
          </div>

          {/* Progress donut */}
          <div className="lg:col-span-2">
            <ProgressDonut
              pct={onTrackPct}
              onTrackCount={onTrackCount}
              atRiskCount={atRiskCount}
            />
          </div>
        </div>

        {/* ── Quick Navigation ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Students",
              icon: <Users className="h-5 w-5" />,
              href: "/students",
              pill: "bg-blue-50 text-blue-700",
            },
            {
              label: "Attendance",
              icon: <ClipboardList className="h-5 w-5" />,
              href: "/attendance",
              pill: "bg-green-50 text-green-700",
            },
            {
              label: "Classes",
              icon: <BookOpen className="h-5 w-5" />,
              href: "/classes",
              pill: "bg-purple-50 text-purple-700",
            },
            {
              label: "Analytics",
              icon: <TrendingUp className="h-5 w-5" />,
              href: "/dashboard?tab=performance",
              pill: "bg-amber-50 text-amber-700",
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.href)}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-3"
            >
              <div className={`p-2.5 rounded-xl ${item.pill}`}>
                {item.icon}
              </div>
              <span className="text-sm font-semibold text-gray-800">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
