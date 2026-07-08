import { AlertCircle, BookOpen, Calendar, MinusCircle, Repeat } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

export type HeroCardMetricKind =
  | "sabaq"
  | "sabaqi"
  | "manzil"
  | "absent"
  | "no-entry";

export interface HeroCardStudent {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export interface HeroCardTodayMetric {
  kind: HeroCardMetricKind;
  ayatCount?: number;
  surahName?: string;
}

export interface HeroCardProps {
  student: HeroCardStudent;
  todayMetric: HeroCardTodayMetric;
  onClick?: () => void;
}

interface MetricPresentation {
  borderClass: string;
  iconBgClass: string;
  iconColorClass: string;
  Icon: typeof BookOpen;
  ariaLabel: string;
}

function getMetricPresentation(kind: HeroCardMetricKind): MetricPresentation {
  switch (kind) {
    case "sabaq":
      return {
        borderClass: "border-l-brand",
        iconBgClass: "bg-brand-muted",
        iconColorClass: "text-brand",
        Icon: BookOpen,
        ariaLabel: "New lesson (sabaq)",
      };
    case "sabaqi":
      return {
        borderClass: "border-l-[hsl(var(--muted-foreground))]",
        iconBgClass: "bg-muted",
        iconColorClass: "text-muted-foreground",
        Icon: Repeat,
        ariaLabel: "Recent revision (sabaqi)",
      };
    case "manzil":
      return {
        borderClass: "border-l-[hsl(var(--muted-foreground))]",
        iconBgClass: "bg-muted",
        iconColorClass: "text-muted-foreground",
        Icon: Calendar,
        ariaLabel: "Long revision (manzil)",
      };
    case "no-entry":
      return {
        borderClass: "border-l-amber-500",
        iconBgClass: "bg-amber-100 dark:bg-amber-950/40",
        iconColorClass: "text-amber-600 dark:text-amber-400",
        Icon: MinusCircle,
        ariaLabel: "No entry today",
      };
    case "absent":
      return {
        borderClass: "border-l-rose-500",
        iconBgClass: "bg-rose-100 dark:bg-rose-950/40",
        iconColorClass: "text-rose-600 dark:text-rose-400",
        Icon: AlertCircle,
        ariaLabel: "Marked absent",
      };
  }
}

function getHeadline(metric: HeroCardTodayMetric): string {
  const { kind, ayatCount, surahName } = metric;
  const count = typeof ayatCount === "number" ? ayatCount : 0;
  const ayatWord = count === 1 ? "ayah" : "ayāt";
  const surahSuffix = surahName ? ` from ${surahName}` : "";

  switch (kind) {
    case "sabaq":
      return ayatCount && ayatCount > 0
        ? `Memorized ${count} ${ayatWord}${surahSuffix} today`
        : `New sabaq${surahSuffix} today`;
    case "sabaqi":
      return ayatCount && ayatCount > 0
        ? `Revised ${count} ${ayatWord}${surahSuffix}`
        : `Revised recent lessons${surahSuffix}`;
    case "manzil":
      return ayatCount && ayatCount > 0
        ? `Reviewed ${count} ${ayatWord}${surahSuffix}`
        : `Reviewed manzil${surahSuffix}`;
    case "no-entry":
      return "No entry logged today";
    case "absent":
      return "Did not attend";
  }
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

export function HeroCard({ student, todayMetric, onClick }: HeroCardProps) {
  const presentation = getMetricPresentation(todayMetric.kind);
  const headline = getHeadline(todayMetric);
  const { Icon, borderClass, iconBgClass, iconColorClass, ariaLabel } = presentation;

  const cardContent = (
    <div className="flex items-center gap-4 p-5">
      <Avatar className="h-16 w-16 shrink-0">
        {student.photoUrl
          ? (
            <AvatarImage
              src={student.photoUrl}
              alt={`${student.name} profile photo`}
            />
          )
          : null}
        <AvatarFallback className="bg-brand-muted text-brand text-xl font-semibold">
          {getInitial(student.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-lg font-semibold text-foreground">
          {student.name}
        </p>
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              iconBgClass,
            )}
            aria-hidden="true"
          >
            <Icon className={cn("h-4 w-4", iconColorClass)} />
          </span>
          <p
            className="text-2xl font-bold leading-tight text-foreground"
            aria-label={`${ariaLabel}: ${headline}`}
          >
            {headline}
          </p>
        </div>
      </div>
    </div>
  );

  const cardClasses = cn(
    "rounded-2xl border-l-4 bg-surface-elevated shadow-sm",
    "motion-safe:transition-shadow motion-safe:duration-200",
    borderClass,
  );

  if (onClick) {
    return (
      <Card
        asChild={false}
        className={cn(cardClasses, "p-0 overflow-hidden")}
      >
        <button
          type="button"
          onClick={onClick}
          aria-label={`${student.name} — ${headline}. View details.`}
          className={cn(
            "group flex w-full min-h-11 items-stretch text-left",
            "motion-safe:transition-colors motion-safe:duration-200",
            "hover:bg-surface focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          {cardContent}
        </button>
      </Card>
    );
  }

  return (
    <Card
      className={cardClasses}
      role="group"
      aria-label={`${student.name} — ${headline}`}
    >
      {cardContent}
    </Card>
  );
}

export function HeroCardSkeleton() {
  return (
    <Card
      className="rounded-2xl border-l-4 border-l-[hsl(var(--border))] bg-surface-elevated shadow-sm"
      role="status"
      aria-label="Loading today's progress"
      aria-busy="true"
    >
      <div className="flex items-center gap-4 p-5">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-7 w-3/4" />
        </div>
      </div>
      <span className="sr-only">Loading today's progress</span>
    </Card>
  );
}

export default HeroCard;
