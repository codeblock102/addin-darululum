
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LineChart, CalendarDays } from "lucide-react";
import { SummaryData } from "@/types/teacher";

interface DashboardSummaryProps {
  summaryData: SummaryData | undefined;
}

export const DashboardSummary = ({ summaryData }: DashboardSummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData?.studentsCount || 0}</div>
          <p className="text-xs text-muted-foreground">
            Total students assigned to you
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Progress</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData?.recentProgressEntries || 0}</div>
          <p className="text-xs text-muted-foreground">
            Progress entries in the last 7 days
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData?.todayClasses || 0}</div>
          <p className="text-xs text-muted-foreground">
            Classes scheduled for today
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
