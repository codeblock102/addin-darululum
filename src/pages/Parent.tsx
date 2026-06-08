import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useParentChildren } from "@/hooks/useParentChildren.ts";
import { ChildSelector } from "@/components/parent/ChildSelector.tsx";

import { HeroCard, HeroCardSkeleton } from "@/components/parent/dashboard/HeroCard.tsx";
import { JuzGrid, JuzGridSkeleton } from "@/components/parent/dashboard/JuzGrid.tsx";
import {
  StreakHeader,
  StreakHeaderSkeleton,
} from "@/components/parent/dashboard/StreakHeader.tsx";
import { KPITiles, KPITilesSkeleton } from "@/components/parent/dashboard/KPITiles.tsx";
import { ActivityFeed } from "@/components/parent/dashboard/ActivityFeed.tsx";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { EmptyState } from "@/components/analytics/EmptyState.tsx";

import {
  buildActivityEntries,
  deriveAttendancePct,
  deriveJuzGrid,
  deriveStreakDays,
  deriveTodayMetric,
  useParentRecentMessages,
  useParentUpcomingEvents,
  useStudentAttendance,
  useStudentJuzRevisions,
  useStudentProgressFeed,
  useStudentRow,
  useStudentSabaqPara,
} from "@/hooks/parent-dashboard/useParentDashboardData.ts";

type ParentAssignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  student_ids: string[];
  submission_status?: "assigned" | "submitted" | "graded" | null;
  submission_grade?: number | null;
  submission_feedback?: string | null;
};

const Parent = () => {
  const { session } = useAuth();
  const parentUserId = session?.user?.id ?? null;
  const { children, isLoading: childrenLoading } = useParentChildren();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (children.length === 0) {
      setSelectedStudentId(null);
      return;
    }
    if (
      !selectedStudentId ||
      !children.some((c) => c.id === selectedStudentId)
    ) {
      setSelectedStudentId(children[0].id);
    }
  }, [children, selectedStudentId]);

  // Core dashboard data
  const { data: progress, isLoading: progressLoading } = useStudentProgressFeed(
    selectedStudentId,
  );
  const { data: attendance, isLoading: attendanceLoading } =
    useStudentAttendance(selectedStudentId);
  const { data: sabaqPara, isLoading: sabaqParaLoading } =
    useStudentSabaqPara(selectedStudentId);
  const { data: juzRevisions, isLoading: juzRevisionsLoading } =
    useStudentJuzRevisions(selectedStudentId);
  const { data: studentRow, isLoading: studentRowLoading } = useStudentRow(
    selectedStudentId,
  );
  const { data: messages, isLoading: messagesLoading } =
    useParentRecentMessages(parentUserId);
  const { data: events, isLoading: eventsLoading } = useParentUpcomingEvents();

  // Preserved: assignments card ("Current Work")
  const { data: assignments } = useQuery<ParentAssignment[]>({
    queryKey: ["parent-student-assignments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("teacher_assignments")
        .select("id, title, description, due_date, status, student_ids")
        .contains("student_ids", [selectedStudentId]);
      if (error) throw error;
      const list = (data || []) as ParentAssignment[];
      if (list.length === 0) return list;
      const ids = list.map((a) => a.id);
      const { data: subs } = await supabase
        .from("teacher_assignment_submissions")
        .select("assignment_id, status, grade, feedback")
        .eq("student_id", selectedStudentId)
        .in("assignment_id", ids);
      const subMap = new Map(
        (subs || []).map(
          (s: {
            assignment_id: string;
            status: string;
            grade: number | null;
            feedback: string | null;
          }) => [s.assignment_id, s],
        ),
      );
      return list.map((a) => {
        const sub = subMap.get(a.id);
        return {
          ...a,
          submission_status:
            (sub?.status as ParentAssignment["submission_status"]) ?? null,
          submission_grade: sub?.grade ?? null,
          submission_feedback: sub?.feedback ?? null,
        };
      });
    },
    enabled: !!selectedStudentId,
  });

  // Derivations
  const todayMetric = useMemo(
    () => deriveTodayMetric(progress, attendance),
    [progress, attendance],
  );
  const streakDays = useMemo(() => deriveStreakDays(progress), [progress]);
  const attendancePct = useMemo(
    () => deriveAttendancePct(attendance),
    [attendance],
  );
  const juzGrid = useMemo(
    () => deriveJuzGrid(studentRow ?? null, juzRevisions, progress),
    [studentRow, juzRevisions, progress],
  );
  const juzCompleted = useMemo(
    () =>
      juzGrid.filter(
        (j) => j.status === "memorized" || j.status === "under-revision",
      ).length,
    [juzGrid],
  );
  const activityEntries = useMemo(
    () =>
      buildActivityEntries({
        progress,
        attendance,
        sabaqPara,
        juzRevisions,
        messages,
        events,
        limit: 25,
      }),
    [progress, attendance, sabaqPara, juzRevisions, messages, events],
  );

  const selectedChild = children.find((c) => c.id === selectedStudentId);

  // Hero loading is bound to progress + attendance — those drive today's metric.
  const heroLoading = progressLoading || attendanceLoading;
  // TODO: replace with a real revision-streak query (e.g. student_dhor_summaries
  // or a dedicated streak table) once we model freezes/last-revised. For now we
  // derive from consecutive progress days and assume 0 freezes.
  const streakLoading = progressLoading;
  const freezesRemaining = 0;
  // Prefer the local-day `date` column (YYYY-MM-DD as the teacher logged it) and
  // fall back to the UTC `created_at` timestamp. Using `created_at` alone would
  // disagree with deriveTodayMetric for entries logged just after UTC midnight
  // when the parent's local day is still the previous day (or vice-versa).
  const lastRevisedAt = progress?.[0]?.date ?? progress?.[0]?.created_at ?? null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header row: title + streak + child selector */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Track your child's progress and school activity.
            </p>
          </div>
          {selectedStudentId ? (
            streakLoading ? (
              <StreakHeaderSkeleton />
            ) : (
              <StreakHeader
                streakDays={streakDays}
                freezesRemaining={freezesRemaining}
                lastRevisedAt={lastRevisedAt}
              />
            )
          ) : null}
        </div>
        <ChildSelector
          children={children}
          selectedId={selectedStudentId}
          onSelect={setSelectedStudentId}
          isLoading={childrenLoading}
        />
      </div>

      {selectedStudentId && (
        <>
          {/* Hero card — today's snapshot */}
          {heroLoading || !selectedChild ? (
            <HeroCardSkeleton />
          ) : (
            <HeroCard
              student={{
                id: selectedChild.id,
                name: selectedChild.name,
                photoUrl: selectedChild.photo_url ?? null,
              }}
              todayMetric={todayMetric}
            />
          )}

          {/* KPI tiles */}
          {studentRowLoading || attendanceLoading || progressLoading ? (
            <KPITilesSkeleton />
          ) : (
            <KPITiles
              streak={streakDays}
              juzCompleted={juzCompleted}
              attendancePct={attendancePct}
            />
          )}

          {/* Juz grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Juz Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {studentRowLoading ? (
                <JuzGridSkeleton />
              ) : (
                <JuzGrid progress={juzGrid} />
              )}
            </CardContent>
          </Card>

          {/* Preserved: pending assignments / current work */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Work</CardTitle>
            </CardHeader>
            <CardContent>
              {(assignments || []).length === 0 ? (
                <EmptyState
                  message="No assignments"
                  description="Assignments will appear here once your teacher creates them."
                  icon={<ClipboardList className="h-8 w-8 text-gray-400" />}
                />
              ) : (
                <ul className="space-y-3">
                  {(assignments || []).map((as) => {
                    const effectiveStatus = as.submission_status ?? as.status;
                    const isGraded = effectiveStatus === "graded";
                    return (
                      <li
                        key={as.id}
                        className="p-3 rounded-lg border flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-medium text-sm truncate">{as.title}</div>
                          {as.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {as.description}
                            </div>
                          )}
                          {as.due_date && (
                            <div className="text-xs text-muted-foreground">
                              Due: {as.due_date}
                            </div>
                          )}
                          {isGraded && as.submission_feedback && (
                            <div className="text-xs text-foreground/70 mt-1 line-clamp-2">
                              Feedback: {as.submission_feedback}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isGraded && as.submission_grade != null && (
                            <span className="text-sm font-semibold tabular-nums">
                              {as.submission_grade}
                            </span>
                          )}
                          <Badge
                            variant={isGraded ? "secondary" : "outline"}
                            className={`capitalize ${
                              isGraded
                                ? "bg-green-100 text-green-800 border-green-200"
                                : ""
                            }`}
                          >
                            {effectiveStatus}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Activity feed — merged stream of attendance / progress / messages / events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                entries={activityEntries}
                isLoading={
                  progressLoading ||
                  attendanceLoading ||
                  sabaqParaLoading ||
                  juzRevisionsLoading ||
                  messagesLoading ||
                  eventsLoading
                }
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Parent;
