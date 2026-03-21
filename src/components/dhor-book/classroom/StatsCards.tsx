import {
  Card,
  CardContent,
} from "@/components/ui/card.tsx";
import type { CompletionStats } from "./types.ts";

interface StatsCardsProps {
  stats: CompletionStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Total Students
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Sabaq Completed
          </div>
          <div className="text-2xl font-bold">
            {stats.sabaq}{" "}
            <span className="text-sm text-muted-foreground">
              / {stats.total}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Sabaq Para Completed
          </div>
          <div className="text-2xl font-bold">
            {stats.sabaqPara}{" "}
            <span className="text-sm text-muted-foreground">
              / {stats.total}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/40">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            Dhor Completed
          </div>
          <div className="text-2xl font-bold">
            {stats.dhor}{" "}
            <span className="text-sm text-muted-foreground">
              / {stats.total}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
