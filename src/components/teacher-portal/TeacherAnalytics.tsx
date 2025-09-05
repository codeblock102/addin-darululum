import { useState } from "react";
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

  // Transform the data for the charts if available
  const timeProgress = data?.timeProgress?.map((item) => ({
    date: item.date,
    count: Number(item.count) || 0,
  })) || [];

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
      <AnalyticsHeader stats={stats} />

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">{t("pages.teacherPortal.analytics.tabs.progress")}</TabsTrigger>
          <TabsTrigger value="students">{t("pages.teacherPortal.analytics.tabs.students")}</TabsTrigger>
          <TabsTrigger value="trends">{t("pages.teacherPortal.analytics.tabs.trends")}</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("pages.teacherPortal.analytics.progressDistribution.title")}</CardTitle>
                <CardDescription>{t("pages.teacherPortal.analytics.progressDistribution.desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressDistributionChart data={formattedQualityData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("pages.teacherPortal.analytics.progressOverTime.title")}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4">
                    <span>{t("pages.teacherPortal.analytics.progressOverTime.desc.unit")}</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setCurrentView("week")}
                        className={`text-xs px-2 py-0.5 rounded ${
                          currentView === "week"
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t("pages.teacherPortal.analytics.progressOverTime.desc.week")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentView("month")}
                        className={`text-xs px-2 py-0.5 rounded ${
                          currentView === "month"
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t("pages.teacherPortal.analytics.progressOverTime.desc.month")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentView("year")}
                        className={`text-xs px-2 py-0.5 rounded ${
                          currentView === "year"
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t("pages.teacherPortal.analytics.progressOverTime.desc.year")}
                      </button>
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimeProgressChart data={timeProgress} />
              </CardContent>
            </Card>
          </div>
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
