import { useTeacherClasses } from "@/hooks/useTeacherClasses.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { ScheduleCalendar } from "@/components/teacher-portal/schedule/ScheduleCalendar.tsx";
import { Loader2, CalendarDays } from "lucide-react";

const TeacherSchedule = () => {
  const { session } = useAuth();
  const teacherId = session?.user?.id || "";
  const { data: classes, isLoading, error } = useTeacherClasses(teacherId);

  const todayLabel = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 sm:p-6 md:p-8 flex flex-col gap-5">

      {/* ── Banner ── */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 55%, #166534 100%)" }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute right-8 -bottom-10 w-28 h-28 rounded-full pointer-events-none" style={{ background: "rgba(255,255,255,0.04)" }} />
        <div className="relative">
          <p className="text-sm font-medium" style={{ color: "#86efac" }}>{todayLabel}</p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: "white" }}>My Schedule</h1>
          <p className="text-sm mt-1" style={{ color: "#bbf7d0" }}>
            {classes && classes.length > 0
              ? `${classes.length} class${classes.length !== 1 ? "es" : ""} on your timetable`
              : "Your weekly class timetable"}
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2">
            <CalendarDays className="h-4 w-4" style={{ color: "#bbf7d0" }} />
            <span className="text-sm font-medium" style={{ color: "white" }}>
              {isLoading ? "Loading…" : `${classes?.length ?? 0} classes`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Calendar card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1 min-h-0" style={{ minHeight: "600px" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-sm text-gray-500">Loading your schedule…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-sm font-semibold text-red-600">Failed to load schedule</p>
              <p className="text-xs text-gray-400 mt-1">{error.message}</p>
            </div>
          </div>
        ) : (classes?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <CalendarDays className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-base font-semibold text-gray-800">No classes found</p>
            <p className="text-sm text-gray-500 max-w-xs text-center">
              Your schedule will appear here once classes are assigned. Ask an admin to run the schedule seed.
            </p>
          </div>
        ) : (
          <div className="h-full" style={{ minHeight: "560px" }}>
            <ScheduleCalendar classes={classes || []} teacherId={teacherId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSchedule;
