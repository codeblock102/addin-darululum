import { Teacher } from "@/types/teacher.ts";
import { Loader2, ShieldCheck, Users, UserX, CalendarDays } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

interface DashboardHeaderProps {
  teacher: Teacher;
  classes?: { id: string; name: string; subject: string }[];
  isLoadingClasses: boolean;
  isAdmin?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const DashboardHeader = (
  { teacher, classes, isLoadingClasses, isAdmin: isAdminProp }: DashboardHeaderProps,
) => {
  const { t } = useI18n();
  const isAdmin = isAdminProp ?? teacher.subject === "Administration";

  const today = new Date().toISOString().split("T")[0];

  // Query: my students count
  const { data: studentCountData, isLoading: loadingStudents } = useQuery({
    queryKey: ["teacher-student-count", teacher.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("students_teachers")
        .select("*", { count: "exact", head: true })
        .eq("teacher_id", teacher.id);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !isAdmin && !!teacher.id,
  });

  // Query: today absent count (needs student ids first)
  const { data: studentIds } = useQuery({
    queryKey: ["teacher-student-ids", teacher.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students_teachers")
        .select("student_id")
        .eq("teacher_id", teacher.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.student_id);
    },
    enabled: !isAdmin && !!teacher.id,
  });

  const { data: absentCountData, isLoading: loadingAbsent } = useQuery({
    queryKey: ["teacher-today-absent", teacher.id, today],
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
    enabled: !isAdmin && !!teacher.id && !!studentIds,
  });

  const studentCount = studentCountData ?? 0;
  const absentCount = absentCountData ?? 0;
  const classCount = classes?.length ?? 0;

  const bannerStyle = {
    background: "linear-gradient(135deg, #052e16 0%, #14532d 60%, #166534 100%)",
  };

  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden shadow-lg"
      style={bannerStyle}
    >
      <div className="px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

          {/* Left side */}
          <div className="flex-1 min-w-0">
            {isAdmin
              ? (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <ShieldCheck className="h-6 w-6 flex-shrink-0" style={{ color: "#86efac" }} />
                    <h1
                      className="text-2xl font-black tracking-tight"
                      style={{ color: "white" }}
                    >
                      {t("pages.teacherPortal.header.adminTitle")}
                    </h1>
                  </div>
                  <p className="text-sm mb-3" style={{ color: "#bbf7d0" }}>
                    {formatDate()}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Full Access · Administrator
                  </span>
                </>
              )
              : (
                <>
                  <p className="text-sm font-medium mb-0.5" style={{ color: "#86efac" }}>
                    {getGreeting()}
                  </p>
                  <h1
                    className="text-2xl font-black tracking-tight mb-1"
                    style={{ color: "white" }}
                  >
                    {teacher.name}
                  </h1>
                  <p className="text-sm mb-3" style={{ color: "#bbf7d0" }}>
                    {formatDate()}
                  </p>
                  {teacher.subject && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
                    >
                      {teacher.subject}
                    </span>
                  )}
                </>
              )}
          </div>

          {/* Right side — stat chips (desktop only, teacher only) */}
          {!isAdmin && (
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
              {/* My Students */}
              <div
                className="flex flex-col items-center px-5 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="h-3.5 w-3.5" style={{ color: "#86efac" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#86efac" }}>
                    My Students
                  </span>
                </div>
                {loadingStudents
                  ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: "white" }} />
                  : (
                    <span className="text-2xl font-black" style={{ color: "white" }}>
                      {studentCount}
                    </span>
                  )}
              </div>

              {/* Today Absent */}
              <div
                className="flex flex-col items-center px-5 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <UserX className="h-3.5 w-3.5" style={{ color: "#fca5a5" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#fca5a5" }}>
                    Today Absent
                  </span>
                </div>
                {loadingAbsent
                  ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: "white" }} />
                  : (
                    <span className="text-2xl font-black" style={{ color: "white" }}>
                      {absentCount}
                    </span>
                  )}
              </div>

              {/* Week Schedule */}
              <div
                className="flex flex-col items-center px-5 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: "#93c5fd" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#93c5fd" }}>
                    Week Schedule
                  </span>
                </div>
                {isLoadingClasses
                  ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: "white" }} />
                  : (
                    <span className="text-2xl font-black" style={{ color: "white" }}>
                      {classCount}
                    </span>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
