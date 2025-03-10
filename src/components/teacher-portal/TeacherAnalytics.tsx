
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { AnalyticsHeader } from "./analytics/AnalyticsHeader";
import { AnalyticsCharts } from "./analytics/AnalyticsCharts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { exportDataAsCSV } from "@/utils/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState("30");
  const { toast } = useToast();
  
  // Set up real-time listener
  useRealtimeAnalytics(teacherId, timeRange);
  
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useAnalyticsData(teacherId, timeRange);

  // Export data as CSV
  const handleExportData = () => {
    exportDataAsCSV(analyticsData?.studentProgress || [], toast);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <AnalyticsHeader 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          onExport={handleExportData}
        />
        <AnalyticsCharts data={analyticsData} />
      </Card>
    </div>
  );
};
