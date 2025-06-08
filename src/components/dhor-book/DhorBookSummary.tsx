import { StudentDhorSummary } from "@/types/dhor-book.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { format } from "date-fns";

interface DhorBookSummaryProps {
  summary: StudentDhorSummary;
  studentId: string;
}

export function DhorBookSummary({ summary }: DhorBookSummaryProps) {
  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium">Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.days_absent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total_points}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {summary.last_entry_date
                ? format(new Date(summary.last_entry_date), "MMM d, yyyy")
                : "No entries yet"}
            </p>
            {summary.last_updated_by && (
              <p className="text-sm text-muted-foreground mt-1">
                By: {summary.last_updated_by}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
