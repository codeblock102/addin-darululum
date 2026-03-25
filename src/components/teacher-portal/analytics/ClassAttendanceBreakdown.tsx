import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";

interface ClassAttendanceBreakdownProps {
  teacherId: string;
  fromYmd: string; // yyyy-MM-dd
  toYmd: string; // yyyy-MM-dd
}

type ClassRow = {
  id: string;
  name: string;
  teacher_ids?: string[] | null;
  time_slots?: Array<{ teacher_ids?: string[] | null }> | null;
  current_students?: string[] | null;
};

type AttendanceRow = { student_id: string; status?: string | null };

function filterClassesForTeacher(rows: ClassRow[], teacherId: string): ClassRow[] {
  return (rows || []).filter((c) => {
    const classLevel = Array.isArray(c.teacher_ids) && c.teacher_ids.includes(teacherId);
    const slotLevel = Array.isArray(c.time_slots)
      && c.time_slots.some((s) => Array.isArray(s?.teacher_ids) && (s!.teacher_ids as string[]).includes(teacherId));
    return classLevel || slotLevel;
  });
}

export const ClassAttendanceBreakdown = ({ teacherId, fromYmd, toYmd }: ClassAttendanceBreakdownProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["class-attendance-breakdown", teacherId, fromYmd, toYmd],
    queryFn: async () => {
      // Fetch classes for teacher including roster
      const { data: classData, error: classErr } = await supabase
        .from("classes")
        .select("id, name, teacher_ids, time_slots, current_students")
        .or(`teacher_ids.cs.{"${teacherId}"},time_slots.not.is.null`);
      if (classErr) throw classErr;

      const classes = filterClassesForTeacher((classData || []) as ClassRow[], teacherId);

      const rosterIds = Array.from(
        new Set(
          classes.flatMap((c) => (Array.isArray(c.current_students) ? (c.current_students as string[]) : [])),
        ),
      );

      // Early return if no students
      if (rosterIds.length === 0) {
        return { classes, attendance: [] as AttendanceRow[] };
      }

      // Attendance for the date range across roster
      const { data: attData, error: attErr } = await supabase
        .from("attendance")
        .select("student_id, status, date")
        .gte("date", fromYmd)
        .lte("date", toYmd)
        .in("student_id", rosterIds);
      if (attErr) throw attErr;

      return { classes, attendance: (attData || []) as AttendanceRow[] };
    },
  });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
          <CardDescription>Loading class attendance breakdown...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse rounded-md bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>Class Attendance</CardTitle>
          <CardDescription>Failed to load class attendance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-sm">{String(error)}</div>
        </CardContent>
      </Card>
    );
  }

  const classes = data?.classes || [];
  const attRows = data?.attendance || [];

  // Aggregate per-student status counts across range
  const statusCountsByStudent: Record<string, { present: number; late: number; absent: number; total: number }> = {};
  for (const r of attRows as Array<{ student_id: string; status?: string | null }>) {
    const sid = String(r?.student_id || "");
    if (!sid) continue;
    const status = String(r?.status || "").toLowerCase();
    if (!statusCountsByStudent[sid]) statusCountsByStudent[sid] = { present: 0, late: 0, absent: 0, total: 0 };
    if (status === "present") statusCountsByStudent[sid].present += 1;
    else if (status === "late") statusCountsByStudent[sid].late += 1;
    else if (status === "absent") statusCountsByStudent[sid].absent += 1;
    statusCountsByStudent[sid].total += 1;
  }

  const cards = classes.map((cls) => {
    const roster = Array.isArray(cls.current_students) ? (cls.current_students as string[]) : [];
    if (roster.length === 0) {
      return { id: cls.id, name: cls.name, present: 0, late: 0, absent: 0, total: 0 };
    }
    let present = 0;
    let late = 0;
    let absent = 0;
    let total = 0;
    for (const sid of roster) {
      const c = statusCountsByStudent[sid];
      if (!c) continue;
      present += c.present;
      late += c.late;
      absent += c.absent;
      total += c.total;
    }
    return { id: cls.id, name: cls.name, present, late, absent, total };
  });

  const hasData = cards.some((c) => c.total > 0);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Class Attendance</CardTitle>
            <CardDescription>Present, late, and absent breakdown per class</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> Late
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Absent
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No attendance records found for this period.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => {
              const presentPct = c.total > 0 ? Math.round((c.present / c.total) * 1000) / 10 : 0;
              const latePct    = c.total > 0 ? Math.round((c.late    / c.total) * 1000) / 10 : 0;
              const absentPct  = c.total > 0 ? Math.round((c.absent  / c.total) * 1000) / 10 : 0;
              const attendancePct = Math.round(presentPct + latePct);

              return (
                <div key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.total} session records</p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        attendancePct >= 90
                          ? "text-emerald-600"
                          : attendancePct >= 75
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {attendancePct}%
                    </span>
                  </div>

                  {/* Segmented progress bar */}
                  {c.total > 0 ? (
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                      {presentPct > 0 && (
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${presentPct}%` }}
                        />
                      )}
                      {latePct > 0 && (
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${latePct}%` }}
                        />
                      )}
                      {absentPct > 0 && (
                        <div
                          className="h-full bg-red-400 transition-all"
                          style={{ width: `${absentPct}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-3 w-full rounded-full bg-gray-100" />
                  )}

                  {/* Stat row */}
                  <div className="mt-3 grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-emerald-700">{presentPct}%</p>
                      <p className="text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-amber-600">{latePct}%</p>
                      <p className="text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-red-600">{absentPct}%</p>
                      <p className="text-muted-foreground">Absent</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};


