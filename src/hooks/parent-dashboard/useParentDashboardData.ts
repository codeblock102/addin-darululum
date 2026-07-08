import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import type { Tables } from "@/types/supabase.ts";
import type {
  HeroCardMetricKind,
  HeroCardTodayMetric,
} from "@/components/parent/dashboard/HeroCard.tsx";
import type {
  ActivityEntry,
  ActivityKind,
  ActivityQuality,
} from "@/components/parent/dashboard/ActivityFeed.tsx";
import type {
  JuzProgressItem,
  JuzStatus,
} from "@/components/parent/dashboard/JuzGrid.tsx";

type ProgressRow = Tables<"progress">;
type AttendanceRow = Tables<"attendance">;
type SabaqParaRow = Tables<"sabaq_para">;
type JuzRevisionRow = Tables<"juz_revisions">;
type CommunicationRow = Tables<"communications">;
type StudentRow = Tables<"students">;

const toLocalKey = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${
    String(d.getDate()).padStart(2, "0")
  }`;
};

const todayISO = () => toLocalKey(new Date());

// Normalize a stored date (YYYY-MM-DD or ISO timestamp) to a local-day key.
const normalizeToLocalKey = (input: string | null | undefined): string | null => {
  if (!input) return null;
  // Pure YYYY-MM-DD — already a local-day key.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalKey(d);
};

const qualityToActivityQuality = (
  q?: string | null,
): ActivityQuality | undefined => {
  if (!q) return undefined;
  const v = q.toLowerCase();
  if (v.includes("excellent") || v === "perfect") return "excellent";
  if (v.includes("good") || v === "fair") return "good";
  if (v.includes("needs") || v === "poor" || v === "needs work") {
    return "needs-work";
  }
  return undefined;
};

const lessonTypeToHeroKind = (
  lessonType?: string | null,
): HeroCardMetricKind => {
  switch ((lessonType ?? "").toLowerCase()) {
    case "sabaq":
      return "sabaq";
    case "sabaqi":
    case "sabqi":
      return "sabaqi";
    case "manzil":
      return "manzil";
    default:
      return "sabaq";
  }
};

/* -------------------------------------------------------------------------- */
/* useStudentProgressFeed — recent progress (sabaq/sabaqi/manzil) entries     */
/* -------------------------------------------------------------------------- */

export const useStudentProgressFeed = (studentId: string | null) => {
  return useQuery<ProgressRow[]>({
    queryKey: ["parent-dashboard", "progress-feed", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as ProgressRow[];
    },
    enabled: !!studentId,
  });
};

/* -------------------------------------------------------------------------- */
/* useStudentAttendance — last 30 attendance records                           */
/* -------------------------------------------------------------------------- */

export const useStudentAttendance = (studentId: string | null) => {
  return useQuery<AttendanceRow[]>({
    queryKey: ["parent-dashboard", "attendance", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, date, status, session, reason")
        .eq("student_id", studentId)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as AttendanceRow[];
    },
    enabled: !!studentId,
  });
};

/* -------------------------------------------------------------------------- */
/* useStudentSabaqPara                                                         */
/* -------------------------------------------------------------------------- */

export const useStudentSabaqPara = (studentId: string | null) => {
  return useQuery<SabaqParaRow[]>({
    queryKey: ["parent-dashboard", "sabaq-para", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("sabaq_para")
        .select("*")
        .eq("student_id", studentId)
        .order("revision_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as SabaqParaRow[];
    },
    enabled: !!studentId,
  });
};

/* -------------------------------------------------------------------------- */
/* useStudentJuzRevisions                                                      */
/* -------------------------------------------------------------------------- */

export const useStudentJuzRevisions = (studentId: string | null) => {
  return useQuery<JuzRevisionRow[]>({
    queryKey: ["parent-dashboard", "juz-revisions", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("juz_revisions")
        .select("*")
        .eq("student_id", studentId)
        .order("revision_date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as JuzRevisionRow[];
    },
    enabled: !!studentId,
  });
};

/* -------------------------------------------------------------------------- */
/* useStudentRow — to read completed_juz / current_juz                         */
/* -------------------------------------------------------------------------- */

export const useStudentRow = (studentId: string | null) => {
  return useQuery<StudentRow | null>({
    queryKey: ["parent-dashboard", "student-row", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, name, completed_juz, current_juz, status, guardian_name, guardian_contact",
        )
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return (data as StudentRow | null) ?? null;
    },
    enabled: !!studentId,
  });
};

/* -------------------------------------------------------------------------- */
/* useParentRecentMessages — last few communications                           */
/* -------------------------------------------------------------------------- */

export const useParentRecentMessages = (parentUserId: string | null) => {
  return useQuery<CommunicationRow[]>({
    queryKey: ["parent-dashboard", "recent-messages", parentUserId],
    queryFn: async () => {
      if (!parentUserId) return [];
      const { data, error } = await supabase
        .from("communications")
        .select(
          "id, message, message_type, category, created_at, sender_id, recipient_id, read",
        )
        .or(`recipient_id.eq.${parentUserId},sender_id.eq.${parentUserId}`)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) {
        // Treat as soft-fail; the feed should still render without messages.
        console.warn("[parent-dashboard] communications query failed:", error);
        return [];
      }
      return (data ?? []) as CommunicationRow[];
    },
    enabled: !!parentUserId,
  });
};

/* -------------------------------------------------------------------------- */
/* useParentUpcomingEvents                                                     */
/* -------------------------------------------------------------------------- */

interface SchoolEventRow {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date?: string | null;
  color?: string | null;
  audience?: string;
}

export const useParentUpcomingEvents = () => {
  return useQuery<SchoolEventRow[]>({
    queryKey: ["parent-dashboard", "upcoming-events"],
    queryFn: async () => {
      const today = todayISO();
      // Narrow typing for the school_events table without casting the whole client.
      const client = supabase as unknown as {
        from: (table: "school_events") => {
          select: (cols: string) => {
            or: (filter: string) => {
              in: (col: string, vals: string[]) => {
                order: (
                  col: string,
                  opts: { ascending: boolean },
                ) => {
                  limit: (
                    n: number,
                  ) => Promise<
                    { data: SchoolEventRow[] | null; error: unknown }
                  >;
                };
              };
            };
          };
        };
      };
      // Include multi-day events that are still ongoing (end_date >= today),
      // and events with no end_date whose start_date is today or later.
      const { data, error } = await client
        .from("school_events")
        .select("id, title, event_type, start_date, end_date, color, audience")
        .or(
          `end_date.gte.${today},and(end_date.is.null,start_date.gte.${today})`,
        )
        .in("audience", ["all", "parents"])
        .order("start_date", { ascending: true })
        .limit(5);
      if (error) {
        console.warn("[parent-dashboard] school_events query failed:", error);
        return [];
      }
      return (data ?? []) as SchoolEventRow[];
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Derivations                                                                 */
/* -------------------------------------------------------------------------- */

export const deriveTodayMetric = (
  progress: ProgressRow[] | undefined,
  attendance: AttendanceRow[] | undefined,
): HeroCardTodayMetric => {
  const today = todayISO();

  const absentToday = (attendance ?? []).find(
    (a) => a.date === today && a.status?.toLowerCase() === "absent",
  );
  if (absentToday) return { kind: "absent" };

  const todays = (progress ?? []).filter((p) => {
    const d = normalizeToLocalKey(p.date) ?? normalizeToLocalKey(p.created_at);
    return d === today;
  });

  if (todays.length === 0) {
    // Surface most recent logged entry even if not today, as a fallback.
    const latest = (progress ?? [])[0];
    if (!latest) return { kind: "no-entry" };
    const kind = lessonTypeToHeroKind(latest.lesson_type as string | null);
    const ayatCount =
      latest.verses_memorized ??
      (latest.start_ayat != null && latest.end_ayat != null
        ? Math.max(0, latest.end_ayat - latest.start_ayat + 1)
        : undefined);
    return {
      kind,
      ayatCount: ayatCount ?? undefined,
      surahName: latest.current_surah ? `Surah ${latest.current_surah}` : undefined,
    };
  }

  // Prefer a sabaq entry; otherwise pick the first today entry.
  const sabaq = todays.find(
    (p) => (p.lesson_type as string | null)?.toLowerCase() === "sabaq",
  );
  const pick = sabaq ?? todays[0];
  const kind = lessonTypeToHeroKind(pick.lesson_type as string | null);
  const ayatCount =
    pick.verses_memorized ??
    (pick.start_ayat != null && pick.end_ayat != null
      ? Math.max(0, pick.end_ayat - pick.start_ayat + 1)
      : undefined);
  return {
    kind,
    ayatCount: ayatCount ?? undefined,
    surahName: pick.current_surah ? `Surah ${pick.current_surah}` : undefined,
  };
};

export const deriveStreakDays = (
  progress: ProgressRow[] | undefined,
): number => {
  // Count consecutive distinct days with any progress entry, ending today or yesterday.
  if (!progress || progress.length === 0) return 0;
  const days = new Set<string>();
  for (const p of progress) {
    // Prefer the stored local date; fall back to the local-day projection of
    // created_at so UTC timestamps don't drift into the wrong day.
    const key = normalizeToLocalKey(p.date) ?? normalizeToLocalKey(p.created_at);
    if (key) days.add(key);
  }
  let streak = 0;
  const cursor = new Date();
  // Allow streak to anchor on yesterday if today has no entry yet.
  const todayKey = toLocalKey(cursor);
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  // Walk backwards.
  // Cap iterations to a sane horizon (365) so a corrupt dataset can't hang the UI.
  for (let i = 0; i < 365; i += 1) {
    const key = toLocalKey(cursor);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const deriveAttendancePct = (
  attendance: AttendanceRow[] | undefined,
): number => {
  if (!attendance || attendance.length === 0) return 0;
  // Use up to 30 most recent attendance entries (already sorted desc by hook).
  const window = attendance.slice(0, 30);
  const present = window.filter(
    (a) => a.status?.toLowerCase() === "present",
  ).length;
  return Math.round((present / window.length) * 100);
};

export const deriveJuzGrid = (
  studentRow: StudentRow | null | undefined,
  juzRevisions: JuzRevisionRow[] | undefined,
  progress: ProgressRow[] | undefined,
): JuzProgressItem[] => {
  // NOTE: Replace with juz_mastery query once we standardise mastery_level → JuzStatus
  // mapping. Tracked separately; current source is
  // students.completed_juz + current_juz + recent juz_revisions.
  const status = new Map<number, JuzStatus>();

  // Memorized: anything in students.completed_juz.
  for (const j of studentRow?.completed_juz ?? []) {
    if (j >= 1 && j <= 30) status.set(j, "memorized");
  }

  // In progress: current_juz from students or latest progress entry.
  const currentJuz =
    studentRow?.current_juz ?? progress?.[0]?.current_juz ?? null;
  if (currentJuz && currentJuz >= 1 && currentJuz <= 30) {
    if (status.get(currentJuz) !== "memorized") {
      status.set(currentJuz, "in-progress");
    }
  }

  // Under-revision: any juz revised in the last 30 days that's memorized.
  // Parse the date in local time and zero the cutoff so a midday tick doesn't
  // flip a revision exactly 30 days old in or out of the bucket.
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 30);
  const recentJuz = new Set<number>();
  for (const r of juzRevisions ?? []) {
    const rd = r.revision_date ? new Date(`${r.revision_date}T00:00:00`) : null;
    if (rd && !Number.isNaN(rd.getTime()) && rd >= cutoff) {
      const num = r.juz_revised ?? r.juz_number;
      if (num != null) recentJuz.add(num);
    }
  }
  for (const j of recentJuz) {
    if (status.get(j) === "memorized") status.set(j, "under-revision");
  }

  return Array.from({ length: 30 }, (_, i) => ({
    juzNumber: i + 1,
    status: status.get(i + 1) ?? "empty",
  }));
};

export const buildActivityEntries = (params: {
  progress?: ProgressRow[];
  attendance?: AttendanceRow[];
  sabaqPara?: SabaqParaRow[];
  juzRevisions?: JuzRevisionRow[];
  messages?: CommunicationRow[];
  events?: SchoolEventRow[];
  limit?: number;
}): ActivityEntry[] => {
  const {
    progress = [],
    attendance = [],
    sabaqPara = [],
    juzRevisions = [],
    messages = [],
    events = [],
    limit = 25,
  } = params;

  const entries: ActivityEntry[] = [];

  for (const p of progress) {
    const lt = (p.lesson_type as string | null)?.toLowerCase();
    const kind: ActivityKind =
      lt === "sabaqi" || lt === "sabqi"
        ? "sabaqi"
        : lt === "manzil"
          ? "manzil"
          : "sabaq";
    const ayatRange =
      p.start_ayat != null && p.end_ayat != null
        ? `Ayāt ${p.start_ayat}–${p.end_ayat}`
        : null;
    const surahPart = p.current_surah ? `Surah ${p.current_surah}` : null;
    const title = [surahPart, ayatRange].filter(Boolean).join(" · ") ||
      "Lesson logged";
    entries.push({
      id: `progress-${p.id}`,
      // For created_at (a real UTC timestamp) keep as-is; for date-only fields
      // anchor at local midday so ActivityFeed's local-day grouping doesn't
      // bleed the entry into an adjacent day.
      date: p.created_at ?? `${p.date ?? todayISO()}T08:00:00`,
      kind,
      title,
      detail: p.notes ?? p.teacher_notes ?? undefined,
      quality: qualityToActivityQuality(p.memorization_quality as string | null),
    });
  }

  for (const a of attendance) {
    entries.push({
      id: `attendance-${a.id}`,
      date: `${a.date}T07:30:00`,
      kind: "attendance",
      title: `Marked ${a.status}${a.session ? ` (${a.session})` : ""}`,
      detail: a.reason ?? undefined,
    });
  }

  for (const s of sabaqPara) {
    entries.push({
      id: `sabaqpara-${s.id}`,
      date: `${s.revision_date}T09:00:00`,
      kind: "sabaqi",
      title: `Sabaq para — Juz ${s.juz_number}`,
      detail: s.teacher_notes ?? undefined,
      quality: qualityToActivityQuality(s.quality_rating as string | null),
    });
  }

  for (const r of juzRevisions) {
    entries.push({
      id: `juzrev-${r.id}`,
      date: `${r.revision_date}T10:00:00`,
      kind: "manzil",
      title: `Manzil — Juz ${r.juz_revised}`,
      detail: r.teacher_notes ?? undefined,
      quality: qualityToActivityQuality(r.memorization_quality as string | null),
    });
  }

  for (const m of messages) {
    entries.push({
      id: `msg-${m.id}`,
      date: m.created_at ?? new Date().toISOString(),
      kind: "message",
      title: m.category ? `Message — ${m.category}` : "New message",
      detail: m.message?.slice(0, 280),
    });
  }

  for (const ev of events) {
    entries.push({
      id: `event-${ev.id}`,
      date: `${ev.start_date}T12:00:00`,
      kind: "event",
      title: ev.title,
      detail: ev.event_type ?? undefined,
    });
  }

  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return entries.slice(0, limit);
};
