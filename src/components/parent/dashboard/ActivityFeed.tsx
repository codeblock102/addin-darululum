import { useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Repeat,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export type ActivityKind =
  | "attendance"
  | "sabaq"
  | "sabaqi"
  | "manzil"
  | "message"
  | "event";

export type ActivityQuality = "excellent" | "good" | "needs-work";

export interface ActivityEntry {
  id: string;
  /** ISO date string */
  date: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  teacherName?: string;
  quality?: ActivityQuality;
}

interface ActivityFeedProps {
  entries: ActivityEntry[];
  isLoading?: boolean;
  className?: string;
}

interface KindMeta {
  label: string;
  code: string;
  icon: typeof BookOpen;
  /** Chip background + text color classes — uses arbitrary palette since these are kind-specific accents, not brand. */
  chip: string;
  /** aria label fragment */
  aria: string;
}

const KIND_META: Record<ActivityKind, KindMeta> = {
  attendance: {
    label: "Attendance",
    code: "AT",
    icon: CheckCircle2,
    chip: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    aria: "Attendance update",
  },
  sabaq: {
    label: "Sabaq",
    code: "SB",
    icon: BookOpen,
    // brand tokens — Sabaq is the headline activity of the day
    chip: "bg-brand-muted text-brand",
    aria: "Sabaq (new lesson)",
  },
  sabaqi: {
    label: "Sabaqi",
    code: "SI",
    icon: Repeat,
    chip:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    aria: "Sabaqi (recent revision)",
  },
  manzil: {
    label: "Manzil",
    code: "MZ",
    icon: ClipboardList,
    chip:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
    aria: "Manzil (long revision)",
  },
  message: {
    label: "Message",
    code: "MS",
    icon: MessageSquare,
    chip:
      "bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-100",
    aria: "Message",
  },
  event: {
    label: "Event",
    code: "EV",
    icon: Sparkles,
    chip:
      "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
    aria: "Event",
  },
};

const QUALITY_LABEL: Record<ActivityQuality, string> = {
  "excellent": "Excellent",
  "good": "Good",
  "needs-work": "Needs work",
};

const QUALITY_BADGE: Record<ActivityQuality, string> = {
  "excellent":
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  "good": "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  "needs-work":
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

/** Safe ISO parse — falls back to Date constructor on failure. */
function safeParse(iso: string): Date {
  try {
    const d = parseISO(iso);
    if (!Number.isNaN(d.getTime())) return d;
  } catch (_) {
    // fall through
  }
  return new Date(iso);
}

function formatDayHeader(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

interface DayGroup {
  key: string;
  date: Date;
  entries: ActivityEntry[];
}

function groupByDay(entries: ActivityEntry[]): DayGroup[] {
  const buckets = new Map<string, DayGroup>();
  for (const entry of entries) {
    const d = safeParse(entry.date);
    const key = format(d, "yyyy-MM-dd");
    const existing = buckets.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      // Anchor the bucket date at midnight so header formatting is stable.
      const anchor = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      buckets.set(key, { key, date: anchor, entries: [entry] });
    }
  }
  // Sort each day's entries desc by date, then sort days desc.
  const groups = Array.from(buckets.values());
  for (const g of groups) {
    g.entries.sort(
      (a, b) => safeParse(b.date).getTime() - safeParse(a.date).getTime(),
    );
  }
  groups.sort((a, b) => b.date.getTime() - a.date.getTime());
  return groups;
}

function EntryCard({ entry }: { entry: ActivityEntry }) {
  const meta = KIND_META[entry.kind];
  const Icon = meta.icon;
  const date = safeParse(entry.date);
  const time = formatTime(date);
  const ariaLabel = [
    meta.aria,
    entry.title,
    entry.detail,
    entry.teacherName ? `logged by ${entry.teacherName}` : null,
    `at ${time}`,
    entry.quality ? QUALITY_LABEL[entry.quality] : null,
  ].filter(Boolean).join(", ");

  return (
    <article
      tabIndex={0}
      role="article"
      aria-label={ariaLabel}
      className={cn(
        "group relative flex min-h-[80px] gap-3 rounded-xl border border-border bg-surface-elevated p-3 shadow-sm",
        "transition-colors motion-safe:transition-shadow",
        "hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
      )}
    >
      {/* Kind chip */}
      <div
        aria-hidden="true"
        className={cn(
          "flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tracking-wide",
          meta.chip,
        )}
        title={meta.label}
      >
        <span className="flex flex-col items-center gap-0.5 leading-none">
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="text-[10px] font-bold">{meta.code}</span>
        </span>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold leading-snug text-foreground">
            {entry.title}
          </h4>
          {entry.quality
            ? (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  QUALITY_BADGE[entry.quality],
                )}
              >
                {QUALITY_LABEL[entry.quality]}
              </span>
            )
            : null}
        </div>
        {entry.detail
          ? (
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {entry.detail}
            </p>
          )
          : null}

        <div className="mt-auto flex items-end justify-end pt-2">
          <p className="text-xs text-muted-foreground">
            {entry.teacherName ? <span>{entry.teacherName} &middot; </span> : null}
            <time dateTime={entry.date}>{time}</time>
          </p>
        </div>
      </div>
    </article>
  );
}

function EntrySkeleton() {
  return (
    <div
      className="flex min-h-[80px] gap-3 rounded-xl border border-border bg-surface-elevated p-3 shadow-sm"
      aria-hidden="true"
    >
      <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3 self-end" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-elevated p-8 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted text-brand">
        <CalendarDays className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Ustadh hasn't logged today's lesson.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Usually posted by 4pm.
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed({
  entries,
  isLoading = false,
  className,
}: ActivityFeedProps) {
  const groups = useMemo(
    () => (isLoading ? [] : groupByDay(entries ?? [])),
    [entries, isLoading],
  );

  if (isLoading) {
    return (
      <div
        className={cn("flex flex-col gap-3", className)}
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading recent activity"
      >
        <EntrySkeleton />
        <EntrySkeleton />
        <EntrySkeleton />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  return (
    <section
      className={cn("flex flex-col gap-6", className)}
      aria-label="Recent activity"
    >
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col">
          <header
            className={cn(
              "sticky top-0 z-10 -mx-1 mb-2 flex items-center justify-between px-1 py-2",
              "bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80",
            )}
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <time dateTime={group.key}>{formatDayHeader(group.date)}</time>
            </h3>
            <span
              className="text-[11px] text-muted-foreground"
              aria-label={`${group.entries.length} ${
                group.entries.length === 1 ? "entry" : "entries"
              }`}
            >
              {group.entries.length}
            </span>
          </header>
          <ol className="flex flex-col gap-2" role="list">
            {group.entries.map((entry) => (
              <li key={entry.id}>
                <EntryCard entry={entry} />
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

export default ActivityFeed;
