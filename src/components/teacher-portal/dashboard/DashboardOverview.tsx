import { useNavigate } from "react-router-dom";
import { AlertTriangle, Users, UserX, ClipboardList, TrendingUp } from "lucide-react";
import { StudentSearch } from "./StudentSearch";
import { QuickActions } from "./QuickActions";
import { TodayStudents } from "./TodayStudents";
import { RecentActivity } from "./RecentActivity";
import { useTeacherStudentMetrics } from "@/hooks/useTeacherStudentMetrics.ts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

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
