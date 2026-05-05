import { useNavigate } from "react-router-dom";
import { AlertTriangle, Users, UserX, ClipboardList, TrendingUp, CalendarDays, GraduationCap, Coffee, Palmtree, Star, BookOpen } from "lucide-react";
import { StudentSearch } from "./StudentSearch";
import { QuickActions } from "./QuickActions";
import { TodayStudents } from "./TodayStudents";
import { RecentActivity } from "./RecentActivity";
import { useTeacherStudentMetrics } from "@/hooks/useTeacherStudentMetrics.ts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { TaskWidget } from "../TaskWidget";
import { format, parseISO } from "date-fns";

const EVENT_TYPE_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  holiday:  { label: "Holiday",  color: "#16a34a", icon: <Palmtree className="h-3.5 w-3.5" /> },
  break:    { label: "Break",    color: "#0ea5e9", icon: <Coffee className="h-3.5 w-3.5" /> },
  pd_day:   { label: "PD Day",   color: "#8b5cf6", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  exam:     { label: "Exam",     color: "#f59e0b", icon: <BookOpen className="h-3.5 w-3.5" /> },
  event:    { label: "Event",    color: "#ec4899", icon: <Star className="h-3.5 w-3.5" /> },
};

interface DashboardOverviewProps {
  teacherId?: string;
  isAdmin?: boolean;
}

export const DashboardOverview = ({ teacherId, isAdmin = false }: DashboardOverviewProps) => {
  const navigate = useNavigate();
  const { data } = useTeacherStudentMetrics(teacherId && !isAdmin ? teacherId : "");

  const atRiskCount = data?.atRiskCount ?? 0;
  const stagnantCount = data?.stagnantCount ?? 0;

  const today = new Date().toISOString().split("T")[0];

  // My Students count
  const { data: studentCount } = useQuery({
    queryKey: ["overview-student-count", teacherId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students_teachers")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !isAdmin && !!teacherId,
  });

  // Student ids (needed for absent count)
  const { data: studentIds } = useQuery({
    queryKey: ["overview-student-ids", teacherId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("students_teachers")
        .select("student_id")
        .eq("teacher_id", teacherId!);
      if (error) throw error;
      return (rows ?? []).map((r) => r.student_id);
    },
    enabled: !isAdmin && !!teacherId,
  });

  // Today absent count
  const { data: absentCount } = useQuery({
    queryKey: ["overview-today-absent", teacherId, today],
    queryFn: async () => {
      if (!studentIds || studentIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("date", today)
        .in("status", ["absent", "sick"])
        .in("student_id", studentIds);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !isAdmin && !!teacherId && !!studentIds,
  });

  // Assignments pending count
  const { data: assignmentsPending } = useQuery({
    queryKey: ["overview-assignments-pending", teacherId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("teacher_assignments")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherId!)
        .neq("status", "graded");
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !isAdmin && !!teacherId,
  });

  // Progress entries today count
  const { data: progressToday } = useQuery({
    queryKey: ["overview-progress-today", teacherId, today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("progress")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacherId!)
        .gte("created_at", `${today}T00:00:00`)
        .lt("created_at", `${today}T23:59:59`);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !isAdmin && !!teacherId,
  });

  // Upcoming school events (teachers see "all" and "teachers" audience)
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ["dashboard-upcoming-events-teacher"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("school_events")
        .select("id, title, event_type, start_date, end_date, color, audience")
        .gte("start_date", today)
        .in("audience", ["all", "teachers"])
        .order("start_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = [
    {
      label: "My Students",
      value: studentCount ?? 0,
      subtitle: "Assigned to you",
      icon: Users,
      iconBg: "bg-green-50",
      iconColor: "#16a34a",
      cardBg: "bg-green-50/60",
    },
    {
      label: "Today Absent",
      value: absentCount ?? 0,
      subtitle: "Absent or sick today",
      icon: UserX,
      iconBg: "bg-red-50",
      iconColor: "#dc2626",
      cardBg: "bg-red-50/60",
    },
    {
      label: "Assignments Pending",
      value: assignmentsPending ?? 0,
      subtitle: "Not yet graded",
      icon: ClipboardList,
      iconBg: "bg-amber-50",
      iconColor: "#d97706",
      cardBg: "bg-amber-50/60",
    },
    {
      label: "Progress Today",
      value: progressToday ?? 0,
      subtitle: "Entries logged today",
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "#2563eb",
      cardBg: "bg-blue-50/60",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      {!isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {stat.label}
                </p>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.iconBg}`}
                >
                  <stat.icon className="h-4 w-4" style={{ color: stat.iconColor }} />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {/* Task widget */}
      {!isAdmin && teacherId && (
        <TaskWidget teacherId={teacherId} />
      )}

      {/* Upcoming school events */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-green-700" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Upcoming School Events</h3>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((ev: { id: string; title: string; event_type: string; start_date: string; end_date?: string | null; color?: string | null; audience?: string }) => {
              const cfg = EVENT_TYPE_MAP[ev.event_type] ?? EVENT_TYPE_MAP.event;
              return (
                <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}22`, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(ev.start_date), "MMM d")}
                      {ev.end_date && ev.end_date !== ev.start_date && ` – ${format(parseISO(ev.end_date), "MMM d")}`}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ background: `${cfg.color}22`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* At-risk alert banner */}
      {(atRiskCount > 0 || stagnantCount > 0) && (
        <button
          type="button"
          onClick={() => navigate("/attendance")}
          className="w-full text-left transition-colors hover:bg-red-100 rounded-2xl border border-red-200 bg-red-50/60 px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {atRiskCount > 0
                  ? `${atRiskCount} student${atRiskCount > 1 ? "s" : ""} need${atRiskCount === 1 ? "s" : ""} immediate attention`
                  : `${stagnantCount} student${stagnantCount > 1 ? "s" : ""} ${stagnantCount === 1 ? "has" : "have"} stalled`}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {atRiskCount > 0 && stagnantCount > 0
                  ? `${atRiskCount} at-risk · ${stagnantCount} stagnant — click to view Attendance`
                  : atRiskCount > 0
                  ? "Low attendance or no recent progress — click to view Attendance"
                  : "No progress logged in 7+ days — click to view Attendance"}
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6">
        <StudentSearch teacherId={teacherId} isAdmin={isAdmin} />
        <QuickActions teacherId={teacherId} isAdmin={isAdmin} />
      </div>

      {/* Bottom section — Today's Students & Recent Activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <TodayStudents teacherId={teacherId} isAdmin={isAdmin} />
        <RecentActivity teacherId={teacherId} isAdmin={isAdmin} />
      </div>
    </div>
  );
};
