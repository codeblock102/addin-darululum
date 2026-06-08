import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

export interface KPITilesProps {
  streak: number;
  juzCompleted: number; // out of 30
  attendancePct: number; // 0-100
}

function getAttendanceColor(pct: number): string {
  if (pct >= 90) return "text-emerald-600";
  if (pct >= 70) return "text-amber-600";
  return "text-rose-600";
}

interface TileProps {
  label: string;
  value: React.ReactNode;
  hint: string;
  ariaLabel: string;
  valueClassName?: string;
}

function Tile({ label, value, hint, ariaLabel, valueClassName }: TileProps) {
  return (
    <Card
      role="group"
      aria-label={ariaLabel}
      className="min-h-24"
    >
      <CardContent className="flex flex-col justify-center gap-1 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div
          className={cn(
            "text-3xl font-bold tabular-nums leading-tight",
            valueClassName,
          )}
        >
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

export function KPITiles({
  streak,
  juzCompleted,
  attendancePct,
}: KPITilesProps) {
  const safeStreak = Math.max(0, Math.floor(streak));
  const safeJuz = Math.max(0, Math.min(30, Math.floor(juzCompleted)));
  const safeAttendance = Math.max(0, Math.min(100, Math.round(attendancePct)));
  const juzRemaining = 30 - safeJuz;

  return (
    <div
      role="list"
      aria-label="Key progress metrics"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      <div role="listitem">
        <Tile
          label="Streak"
          value={safeStreak}
          hint={safeStreak === 1 ? "day in a row" : "days in a row"}
          ariaLabel={`Current streak: ${safeStreak} days`}
        />
      </div>
      <div role="listitem">
        <Tile
          label="Juz Completed"
          value={`${safeJuz} / 30`}
          hint={juzRemaining === 0 ? "Quran complete" : `${juzRemaining} to go`}
          ariaLabel={`Juz completed: ${safeJuz} of 30`}
        />
      </div>
      <div role="listitem">
        <Tile
          label="Attendance"
          value={`${safeAttendance}%`}
          hint="last 30 days"
          ariaLabel={`Attendance: ${safeAttendance} percent`}
          valueClassName={getAttendanceColor(safeAttendance)}
        />
      </div>
    </div>
  );
}

export function KPITilesSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading key metrics"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      {[0, 1, 2].map((i) => (
        <Card key={i} className="min-h-24" aria-hidden="true">
          <CardContent className="flex flex-col justify-center gap-2 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Loading key metrics</span>
    </div>
  );
}

export default KPITiles;
