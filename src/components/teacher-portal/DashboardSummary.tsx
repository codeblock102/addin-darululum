
import { Card, CardContent } from "@/components/ui/card";
import { Users, LineChart, CalendarDays, BookOpen, CheckCircle } from "lucide-react";
import { SummaryData } from "@/types/teacher";

interface DashboardSummaryProps {
  summaryData: SummaryData | undefined;
}

export const DashboardSummary = ({ summaryData }: DashboardSummaryProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="overflow-hidden border-green-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-lg">Attendance</h3>
            <p className="text-4xl font-bold">{summaryData?.attendanceRate || "98"}%</p>
          </div>
          <div className="p-3 bg-green-100 dark:bg-green-800/30 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Last absent:</span>
              <span className="font-medium">March 2, 2025</span>
            </div>
            <div className="flex justify-between">
              <span>Reason:</span>
              <span className="font-medium">Sick leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-amber-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-lg">Fee Due</h3>
            <p className="text-4xl font-bold">${summaryData?.outstandingFees || "0"}</p>
          </div>
          <div className="p-3 bg-amber-100 dark:bg-amber-800/30 rounded-full">
            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Last paid:</span>
              <span className="font-medium">April 15, 2025</span>
            </div>
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="font-medium">Online</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-blue-100 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-lg">Exam Marks</h3>
            <p className="text-4xl font-bold">{summaryData?.examAverage || "92"}%</p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
            <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Last Exam:</span>
              <span className="font-medium">1st Semester</span>
            </div>
            <div className="flex justify-between">
              <span>Top Marks:</span>
              <span className="font-medium">Tajweed (96%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
