
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentProgressChart } from "./StudentProgressChart";
import { ProgressDistributionChart } from "./ProgressDistributionChart";
import { TimeProgressChart } from "./TimeProgressChart";
import { ContributorActivityChart } from "./ContributorActivityChart";

interface AnalyticsChartsProps {
  studentProgress: { name: string; verses: number }[];
  qualityDistribution: { quality: string; count: number }[];
  timeProgress: { date: string; count: number }[];
  contributorActivity: { name: string; count: number }[];
  timeRange: 'week' | 'month' | 'year';
}

export const AnalyticsCharts = ({
  studentProgress,
  qualityDistribution,
  timeProgress,
  contributorActivity,
  timeRange
}: AnalyticsChartsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>
            Average verses memorized per student
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <StudentProgressChart data={studentProgress} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Quality Distribution</CardTitle>
          <CardDescription>
            Distribution of memorization quality
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ProgressDistributionChart data={qualityDistribution} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>
            Tracking progress trends over {timeRange}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <TimeProgressChart data={timeProgress} timeRange={timeRange} />
        </CardContent>
      </Card>
      
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Contributor Activity</CardTitle>
          <CardDescription>
            Progress entries by contributor
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ContributorActivityChart data={contributorActivity} />
        </CardContent>
      </Card>
    </div>
  );
};
