/**
 * @file src/components/teacher-portal/TeacherAnalytics.tsx
 * @summary Analytics page with quality distribution, time progress, and student performance charts.
 */

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

const QUALITY_SCORES: Record<string, number> = {
  excellent: 5,
  good: 4,
  average: 3,
  needsWork: 2,
  horrible: 1,
};

const QUALITY_LABELS: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  average: "Average",
  needsWork: "Needs Work",
  horrible: "Needs Improvement",
};

function computeAvgQuality(
  distribution: { quality: string; count: number }[],
): string {
  if (!distribution || distribution.length === 0) return "N/A";

  let totalWeighted = 0;
  let totalCount = 0;

  distribution.forEach(({ quality, count }) => {
    const score = QUALITY_SCORES[quality];
    if (score !== undefined) {
      totalWeighted += score * count;
      totalCount += count;
    }
  });

  if (totalCount === 0) return "N/A";

  const avg = totalWeighted / totalCount;
  const rounded = Math.round(avg * 10) / 10;

  let label = "Average";
  if (avg >= 4.5) label = "Excellent";
  else if (avg >= 3.5) label = "Good";
  else if (avg >= 2.5) label = "Average";
  else label = "Needs Work";

  return `${label} (${rounded}/5)`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
}

const StatCard = ({ title, value, description }: StatCardProps) => (
  <Card>
    <CardContent className="p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const { data, isLoading, error } = useAnalyticsData(teacherId);
  const [currentView, setCurrentView] = useState("week");

  const timeProgress =
    data?.timeProgress?.map((item) => ({
      date: item.date,
      count: Number(item.count) || 0,
    })) || [];

  // Entries in current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const revisionsThisMonth = timeProgress.filter((item) => {
    const d = new Date(item.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((sum, item) => sum + item.count, 0);

  // Entries in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thisWeekEntries = timeProgress.filter(
    (item) => new Date(item.date) >= sevenDaysAgo,
  ).reduce((sum, item) => sum + item.count, 0);

  const avgQuality = computeAvgQuality(data?.qualityDistribution || []);

  const formattedQualityData =
    data?.qualityDistribution?.map((item) => ({
      name: QUALITY_LABELS[item.quality] || item.quality,
      value: Number(item.count) || 0,
    })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Error loading analytics data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Students"
          value={data?.studentProgress?.length || 0}
          description="Students currently assigned to you"
        />
        <StatCard
          title="Average Quality"
          value={avgQuality}
          description="Weighted average memorization quality"
        />
        <StatCard
          title="This Week's Entries"
          value={thisWeekEntries}
          description="Progress entries recorded in the last 7 days"
        />
        <StatCard
          title="Revisions This Month"
          value={revisionsThisMonth}
          description="Total progress entries this month"
        />
      </div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
          <TabsTrigger value="trends">Daily Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Memorization Quality Distribution</CardTitle>
                <CardDescription>
                  Quality breakdown across all students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressDistributionChart data={formattedQualityData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4">
                    <span>Daily entries (last 90 days)</span>
                    <div className="flex items-center gap-2 ml-auto">
                      {(["week", "month", "year"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCurrentView(v)}
                          className={`text-xs px-2 py-0.5 rounded capitalize ${
                            currentView === v
                              ? "bg-emerald-100 text-emerald-800"
                              : "text-muted-foreground"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
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
              <CardTitle>Student Memorization Progress</CardTitle>
              <CardDescription>
                Total verses memorized per student
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <StudentProgressChart data={data?.studentProgress || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>
                Progress entries per day (last 14 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContributorActivityChart data={data?.dailyActivity || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
