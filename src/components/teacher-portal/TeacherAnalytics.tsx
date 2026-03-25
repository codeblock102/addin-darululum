/**
 * Teacher Analytics
 *
 * Replaces the old pre-aggregated chart-heavy view with live per-student
 * metrics via useTeacherStudentMetrics.
 *
 * Tabs:
 *  - Performance  → TeacherStudentInsights table (attendance, pace, risk)
 *  - Attendance   → Per-class attendance breakdown for a date range
 */

import { useState, useMemo } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { format } from "date-fns";
import { TeacherStudentInsights } from "./TeacherStudentInsights.tsx";
import { ClassAttendanceBreakdown } from "./analytics/ClassAttendanceBreakdown.tsx";

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { from, to };
  });

  const dateRangeLabel = useMemo(() => {
    try {
      return `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`;
    } catch {
      return "Select range";
    }
  }, [dateRange]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="performance">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>

          {/* Date range picker — only shown for attendance tab via CSS visibility trick */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 text-xs">
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange as unknown as { from: Date; to?: Date }}
                onSelect={(r: { from?: Date; to?: Date } | undefined) => {
                  if (!r?.from || !r?.to) return;
                  setDateRange({ from: r.from, to: r.to });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <TabsContent value="performance" className="mt-4">
          <TeacherStudentInsights teacherId={teacherId} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <ClassAttendanceBreakdown
            teacherId={teacherId}
            fromYmd={format(dateRange.from, "yyyy-MM-dd")}
            toYmd={format(dateRange.to, "yyyy-MM-dd")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
