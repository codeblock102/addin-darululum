
import { Card, CardContent } from "@/components/ui/card";
import { ProgressDistributionChart } from "./ProgressDistributionChart";
import { TimeProgressChart } from "./TimeProgressChart";
import { StudentProgressChart } from "./StudentProgressChart";
import { ContributorActivityChart } from "./ContributorActivityChart";
import { AnalyticsData } from "@/hooks/useAnalyticsData";

interface AnalyticsChartsProps {
  data: AnalyticsData | null | undefined;
}

export const AnalyticsCharts = ({ data }: AnalyticsChartsProps) => {
  return (
    <CardContent>
      <div className="grid gap-6 md:grid-cols-2">
        <ProgressDistributionChart data={data?.qualityDistribution || []} />
        <TimeProgressChart data={data?.timeProgress || []} />
        <ContributorActivityChart data={data?.contributorActivity || []} />
        <div className="md:col-span-2">
          <StudentProgressChart data={data?.studentProgress || []} />
        </div>
      </div>
    </CardContent>
  );
};
