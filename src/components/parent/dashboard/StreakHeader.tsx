import { Flame, Snowflake } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

export interface StreakHeaderProps {
  streakDays: number;
  freezesRemaining: number;
  lastRevisedAt?: string | Date | null;
  className?: string;
}

/**
 * Returns true if the provided date is the same calendar day as "now" in the local timezone.
 *
 * Accepts either a pure `YYYY-MM-DD` local-day key (e.g. progress.date) or a full
 * ISO timestamp (e.g. progress.created_at, which is UTC). Both are projected to
 * the viewer's local-day key before comparing, matching the rest of the parent
 * dashboard derivations (see normalizeToLocalKey in useParentDashboardData.ts).
 * Without this, a row created at 02:00 UTC "today" would resolve to the previous
 * local day for viewers west of UTC and the "revised today" dot would not show
 * while deriveTodayMetric reported the entry as today's.
 */
const toLocalDayKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${
    String(d.getDate()).padStart(2, "0")
  }`;

const isToday = (value: string | Date | null | undefined): boolean => {
  if (!value) return false;
  let key: string | null = null;
  if (typeof value === "string") {
    // Pure YYYY-MM-DD — already a local-day key.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      key = value;
    } else {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return false;
      key = toLocalDayKey(d);
    }
  } else {
    if (Number.isNaN(value.getTime())) return false;
    key = toLocalDayKey(value);
  }
  return key === toLocalDayKey(new Date());
};

/**
 * Compact horizontal pill summarizing a child's hifz revision streak.
 *
 * Renders a flame + day-count, a freeze-credit badge, and a "revised today"
 * indicator. The streak count is wrapped in an aria-live region so assistive
 * tech announces changes (e.g., when streakDays updates after a daily
 * revision is logged).
 */
export const StreakHeader = ({
  streakDays,
  freezesRemaining,
  lastRevisedAt,
  className,
}: StreakHeaderProps) => {
  const safeStreak = Math.max(0, Math.floor(streakDays));
  const safeFreezes = Math.max(0, Math.floor(freezesRemaining));
  const revisedToday = isToday(lastRevisedAt ?? null);

  return (
    <div
      role="group"
      aria-label={`Revision streak: ${safeStreak} day${safeStreak === 1 ? "" : "s"}`}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border bg-surface-elevated px-3 py-1.5 shadow-sm",
        "min-h-11",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Flame
          aria-hidden="true"
          className="h-5 w-5 text-orange-500 motion-safe:animate-pulse"
        />
        <span
          aria-live="polite"
          aria-atomic="true"
          className="flex items-baseline gap-1"
        >
          <span className="text-lg font-bold leading-none tabular-nums text-foreground">
            {safeStreak}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            day{safeStreak === 1 ? "" : "s"} streak
          </span>
        </span>

        {revisedToday && (
          <span
            role="status"
            title="Revised today"
            aria-label="Revised today"
            className="ml-1 inline-block h-2 w-2 rounded-full bg-emerald-500"
          />
        )}
      </div>

      <Badge
        variant="outline"
        aria-label={`${safeFreezes} freeze${safeFreezes === 1 ? "" : "s"} available`}
        className="gap-1 px-2 py-0.5 text-[11px] font-medium"
      >
        <Snowflake aria-hidden="true" className="h-3 w-3 text-sky-500" />
        <span className="tabular-nums">{safeFreezes}</span>
        <span>freeze{safeFreezes === 1 ? "" : "s"}</span>
      </Badge>
    </div>
  );
};

/**
 * Loading placeholder matching the StreakHeader footprint so layout doesn't
 * jump when streak data resolves.
 */
export const StreakHeaderSkeleton = ({ className }: { className?: string }) => (
  <div
    role="status"
    aria-label="Loading streak"
    aria-busy="true"
    className={cn(
      "inline-flex items-center gap-3 rounded-full border bg-surface-elevated px-3 py-1.5 shadow-sm min-h-11",
      className,
    )}
  >
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="h-5 w-20 rounded-full" />
  </div>
);

export default StreakHeader;
