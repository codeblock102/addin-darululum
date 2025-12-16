import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { useAnalyticsData } from "@/hooks/useAnalyticsData.ts";
import { ProgressDistributionChart } from "./analytics/ProgressDistributionChart.tsx";
import { StudentProgressChart } from "./analytics/StudentProgressChart.tsx";
import { TimeProgressChart } from "./analytics/TimeProgressChart.tsx";
import { ContributorActivityChart } from "./analytics/ContributorActivityChart.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { format } from "date-fns";
import { ClassAttendanceBreakdown } from "./analytics/ClassAttendanceBreakdown.tsx";

interface AnalyticsHeaderProps {
  stats: {
    title: string;
    value: string | number;
    description: string;
    trend: string;
  }[];
}

export const AnalyticsHeader = ({ stats }: AnalyticsHeaderProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  stat.trend.startsWith("+")
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {stat.trend}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const { data, isLoading, error } = useAnalyticsData(teacherId);
  const [currentView, setCurrentView] = useState("week");
  const { t } = useI18n();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - 29);
    return { from, to };
  });

  // Transform the data for the charts if available
  const timeProgress = data?.timeProgress?.map((item) => ({
    date: item.date,
    count: Number(item.count) || 0,
  })) || [];

  const dateRangeLabel = useMemo(() => {
    try {
      return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
    } catch {
      return "Select range";
    }
  }, [dateRange]);

  const stats = [
    {
      title: t("pages.teacherPortal.analytics.stats.totalStudents"),
      value: data?.studentProgress?.length || 0,
      description: t("pages.teacherPortal.analytics.stats.studentsAssigned"),
      trend: "+2.5%",
    },
    {
      title: t("pages.teacherPortal.analytics.stats.avgQuality"),
      value: (data?.qualityDistribution?.length ?? 0) > 0 ? "Good" : "N/A",
      description: t("pages.teacherPortal.analytics.stats.avgQualityDesc"),
      trend: "+0.3",
    },
    {
      title: t("pages.teacherPortal.analytics.stats.activeTasks"),
      value: data?.contributorActivity?.length || 0,
      description: t("pages.teacherPortal.analytics.stats.pendingAssignments"),
      trend: "-2",
    },
    {
      title: t("pages.teacherPortal.analytics.stats.revisionsMonth"),
      value: timeProgress.reduce((sum, item) => sum + item.count, 0),
      description: t("pages.teacherPortal.analytics.stats.revisionsCompleted"),
      trend: "+15.2%",
    },
  ];

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent">
          </div>
          <p className="text-sm text-muted-foreground">
            {t("pages.teacherPortal.analytics.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            {t("pages.teacherPortal.analytics.error")}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Format the quality distribution data for the chart
  const formattedQualityData = data?.qualityDistribution?.map((item) => ({
    name: item.quality,
    value: Number(item.count) || 0,
  })) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">{t("pages.teacherPortal.analytics.tabs.progress")}</TabsTrigger>
          <TabsTrigger value="students">{t("pages.teacherPortal.analytics.tabs.students")}</TabsTrigger>
          <TabsTrigger value="trends">{t("pages.teacherPortal.analytics.tabs.trends")}</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {/* Header controls similar to GA: Date range + timeframe toggles */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Audience Overview</h2>
              <p className="text-sm text-muted-foreground">{t("pages.teacherPortal.analytics.progressOverTime.desc.unit")}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border">
                <Button type="button" variant="ghost" className={`h-8 px-2 text-xs ${currentView === "week" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground"}`} onClick={() => setCurrentView("week")}>
                  {t("pages.teacherPortal.analytics.progressOverTime.desc.week")}
                </Button>
                <Button type="button" variant="ghost" className={`h-8 px-2 text-xs ${currentView === "month" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground"}`} onClick={() => setCurrentView("month")}>
                  {t("pages.teacherPortal.analytics.progressOverTime.desc.month")}
                </Button>
                <Button type="button" variant="ghost" className={`h-8 px-2 text-xs ${currentView === "year" ? "bg-emerald-50 text-emerald-700" : "text-muted-foreground"}`} onClick={() => setCurrentView("year")}>
                  {t("pages.teacherPortal.analytics.progressOverTime.desc.year")}
                </Button>
              </div>
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
          </div>

          {/* Primary line chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.teacherPortal.analytics.progressOverTime.title")}</CardTitle>
              <CardDescription>{dateRangeLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <TimeProgressChart data={timeProgress} />
            </CardContent>
          </Card>

          {/* Summary cards and pie chart, GA-style layout */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AnalyticsHeader stats={stats} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.teacherPortal.analytics.progressDistribution.title")}</CardTitle>
                <CardDescription>{t("pages.teacherPortal.analytics.progressDistribution.desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressDistributionChart data={formattedQualityData} />
              </CardContent>
            </Card>
          </div>

          {/* Per-class attendance breakdown for the selected date range */}
          <ClassAttendanceBreakdown
            teacherId={teacherId}
            fromYmd={format(dateRange.from, "yyyy-MM-dd")}
            toYmd={format(dateRange.to, "yyyy-MM-dd")}
          />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.teacherPortal.analytics.comparison.title")}</CardTitle>
              <CardDescription>{t("pages.teacherPortal.analytics.comparison.desc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <StudentProgressChart data={data?.studentProgress || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pages.teacherPortal.analytics.activity.title")}</CardTitle>
              <CardDescription>{t("pages.teacherPortal.analytics.activity.desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ContributorActivityChart
                data={data?.contributorActivity || []}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
