import { useMemo } from "react";
import { CheckCircle2, Circle, CircleDot, RotateCw } from "lucide-react";

export type JuzStatus = "empty" | "in-progress" | "memorized" | "under-revision";

export interface JuzProgressItem {
  juzNumber: number;
  status: JuzStatus;
}

interface JuzGridProps {
  progress: JuzProgressItem[];
  onCellClick?: (juzNumber: number) => void;
}

const STATUS_LABEL: Record<JuzStatus, string> = {
  "empty": "not started",
  "in-progress": "in progress",
  "memorized": "memorized",
  "under-revision": "under revision",
};

const STATUS_CLASSES: Record<JuzStatus, string> = {
  "empty":
    "bg-surface border border-border text-foreground hover:bg-surface-elevated",
  "in-progress":
    "bg-brand-muted text-brand border border-brand/20 hover:bg-brand-muted/80",
  "memorized":
    "bg-brand text-brand-fg border border-brand hover:bg-brand/90",
  "under-revision":
    "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700/60",
};

const StatusIcon = ({ status }: { status: JuzStatus }) => {
  const iconClass = "h-3 w-3";
  switch (status) {
    case "empty":
      return <Circle className={iconClass} aria-hidden="true" />;
    case "in-progress":
      return <CircleDot className={iconClass} aria-hidden="true" />;
    case "memorized":
      return <CheckCircle2 className={iconClass} aria-hidden="true" />;
    case "under-revision":
      return <RotateCw className={iconClass} aria-hidden="true" />;
  }
};

export const JuzGrid = ({ progress, onCellClick }: JuzGridProps) => {
  // Build a 1..30 lookup so the grid is always 30 cells even if input is partial/unordered.
  const cells = useMemo(() => {
    const byNumber = new Map<number, JuzStatus>();
    for (const item of progress) {
      byNumber.set(item.juzNumber, item.status);
    }

    return Array.from({ length: 30 }, (_, i) => {
      const juzNumber = i + 1;
      const status: JuzStatus = byNumber.get(juzNumber) ?? "empty";
      return { juzNumber, status };
    });
  }, [progress]);

  return (
    <div
      role="grid"
      aria-label="Juz memorization progress, 1 to 30"
      className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2"
    >
      {cells.map(({ juzNumber, status }) => {
        const interactive = typeof onCellClick === "function";
        const label = `Juz ${juzNumber}, ${STATUS_LABEL[status]}`;
        return (
          <button
            key={juzNumber}
            type="button"
            role="gridcell"
            aria-label={label}
            title={label}
            disabled={!interactive}
            onClick={interactive ? () => onCellClick?.(juzNumber) : undefined}
            className={[
              "relative inline-flex items-center justify-center",
              "min-h-11 min-w-11 rounded-md",
              "text-sm font-medium",
              "transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "motion-safe:transition-transform",
              interactive
                ? "cursor-pointer motion-safe:hover:scale-105 motion-reduce:transform-none"
                : "cursor-default",
              "disabled:opacity-100",
              STATUS_CLASSES[status],
            ].join(" ")}
          >
            <span className="absolute top-1 right-1 opacity-80">
              <StatusIcon status={status} />
            </span>
            <span aria-hidden="true">{juzNumber}</span>
          </button>
        );
      })}
    </div>
  );
};

export const JuzGridSkeleton = () => {
  return (
    <div
      role="status"
      aria-label="Loading juz progress"
      aria-busy="true"
      className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2"
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="min-h-11 min-w-11 rounded-md bg-surface border border-border motion-safe:animate-pulse motion-reduce:animate-none"
        />
      ))}
      <span className="sr-only">Loading juz progress...</span>
    </div>
  );
};

export default JuzGrid;
