import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  ProgressDistributionChart, 
  StudentProgressChart, 
  TimeProgressChart, 
  ContributorActivityChart 
} from "./analytics";
import { AnalyticsCharts } from "./analytics/AnalyticsCharts";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Download } from "lucide-react";

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const { data, isLoading } = useAnalyticsData(teacherId);
  
  // Transform data for StudentProgressChart with proper typing
  const studentProgressData = data?.studentProgress?.map(item => ({
    name: item.name,
    verses: Number(item.verses) // Ensure verses is a number
  })) || [];

  // Transform data for charts with proper typing
  const formattedQualityData = data?.qualityDistribution.map(item => ({
    quality: item.quality,
    count: Number(item.count) // Ensure count is a number
  })) || [];

  const formattedTimeData = data?.timeProgress.map(item => ({
    date: item.date,
    count: Number(item.count) // Ensure count is a number
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Monitor student progress and performance metrics
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {data && (
            <AnalyticsCharts
              studentProgress={data.studentProgress || []}
              qualityDistribution={formattedQualityData || []}
              timeProgress={formattedTimeData || []}
              contributorActivity={data.contributorActivity || []}
              timeRange={timeRange}
            />
          )}
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Student Progress</CardTitle>
              <CardDescription>
                Track individual student progress over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <StudentProgressChart data={studentProgressData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time" className="space-y-4">
          <div className="flex justify-end mb-4">
            <div className="space-x-2">
              <Button 
                variant={timeRange === 'week' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeRange('week')}
              >
                Week
              </Button>
              <Button 
                variant={timeRange === 'month' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeRange('month')}
              >
                Month
              </Button>
              <Button 
                variant={timeRange === 'year' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTimeRange('year')}
              >
                Year
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Progress Over Time</CardTitle>
              <CardDescription>
                Tracking progress trends over {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <TimeProgressChart 
                data={data?.timeProgress || []} 
                timeRange={timeRange}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contributors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contributor Activity</CardTitle>
              <CardDescription>
                Progress entries by contributor
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ContributorActivityChart data={data?.contributorActivity || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
