import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { ChildSelector } from "@/components/parent/ChildSelector.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/types/supabase.ts";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute.tsx";
import { BookOpen, CalendarCheck, ClipboardList, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/analytics/EmptyState.tsx";

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "present": return "bg-green-100 text-green-800 border-green-200";
    case "absent":  return "bg-red-100 text-red-800 border-red-200";
    case "late":    return "bg-amber-100 text-amber-800 border-amber-200";
    default:        return "bg-muted text-muted-foreground";
  }
};

const Parent = () => {
  const { children, isLoading } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStudentId && children.length > 0) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  const { data: progressEntries } = useQuery({
    queryKey: ["parent-student-progress", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("progress")
        .select("*, students(name)")
        .eq("student_id", selectedStudentId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: attendance } = useQuery<Tables<"attendance">[]>({
    queryKey: ["parent-student-attendance", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", selectedStudentId)
        .order("date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const { data: assignments } = useQuery({
    queryKey: ["parent-student-assignments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("id, title, description, due_date, status, student_ids")
        .contains("student_ids", [selectedStudentId]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  // Derived stats
  const attendanceRate = (() => {
    if (!attendance || attendance.length === 0) return null;
    const present = attendance.filter((a) => a.status?.toLowerCase() === "present").length;
    return Math.round((present / attendance.length) * 100);
  })();

  const lastProgress = progressEntries?.[0];
  const pendingAssignments = (assignments || []).filter(
    (a: { status: string }) => a.status?.toLowerCase() !== "graded"
  ).length;

  return (
    <ProtectedRoute requireParent>
      <div className="space-y-6 animate-fadeIn">
        {/* Header + child selector */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Parent Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-4">Track your child's progress and school activity.</p>
          <ChildSelector
            children={children}
            selectedId={selectedStudentId}
            onSelect={setSelectedStudentId}
            isLoading={isLoading}
          />
        </div>

        {selectedStudentId && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CalendarCheck className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Attendance</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {attendanceRate !== null ? `${attendanceRate}%` : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {attendance?.length ?? 0} sessions recorded
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Qur'an</span>
                  </div>
                  <div className="text-lg font-semibold leading-tight">
                    {lastProgress
                      ? `Surah ${lastProgress.current_surah ?? "—"}, Juz ${lastProgress.current_juz ?? "—"}`
                      : "No entries yet"}
                  </div>
                  {lastProgress?.memorization_quality && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Quality: {lastProgress.memorization_quality}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Pending Work</span>
                  </div>
                  <div className="text-3xl font-bold">{pendingAssignments}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {(assignments || []).length} total assignments
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Progress Entries</span>
                  </div>
                  <div className="text-3xl font-bold">{progressEntries?.length ?? 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">last 20 sessions</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {(attendance || []).length === 0 ? (
                  <EmptyState message="No attendance records" description="Attendance will appear here once it's recorded." icon={<CalendarCheck className="h-8 w-8 text-gray-400" />} />
                ) : (
                  <ul className="space-y-2">
                    {(attendance || []).slice(0, 10).map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{a.date}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor(a.status)}`}>
                          {a.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent Qur'an progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Qur'an Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {(progressEntries || []).length === 0 ? (
                  <EmptyState message="No progress entries yet" description="Progress will appear here once your teacher logs entries." icon={<TrendingUp className="h-8 w-8 text-gray-400" />} />
                ) : (
                  <ul className="space-y-3">
                    {(progressEntries || []).slice(0, 5).map((p: Tables<"progress">) => (
                      <li key={p.id} className="p-3 rounded-lg border bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">
                            Surah {p.current_surah ?? "—"}, Juz {p.current_juz ?? "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Verses {p.start_ayat ?? "—"}–{p.end_ayat ?? "—"}
                          {p.memorization_quality && ` · Quality: ${p.memorization_quality}`}
                        </div>
                        {p.notes && <div className="text-xs text-foreground/70">{p.notes}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Pending assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Work</CardTitle>
              </CardHeader>
              <CardContent>
                {(assignments || []).length === 0 ? (
                  <EmptyState message="No assignments" description="Assignments will appear here once your teacher creates them." icon={<ClipboardList className="h-8 w-8 text-gray-400" />} />
                ) : (
                  <ul className="space-y-3">
                    {(assignments || []).map((as: { id: string; title: string; description: string | null; due_date: string | null; status: string }) => (
                      <li key={as.id} className="p-3 rounded-lg border flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-medium text-sm truncate">{as.title}</div>
                          {as.description && (
                            <div className="text-xs text-muted-foreground truncate">{as.description}</div>
                          )}
                          {as.due_date && (
                            <div className="text-xs text-muted-foreground">Due: {as.due_date}</div>
                          )}
                        </div>
                        <Badge variant={as.status === "graded" ? "secondary" : "outline"} className="shrink-0 capitalize">
                          {as.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Parent;
