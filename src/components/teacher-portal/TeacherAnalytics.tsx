
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { Loader2 } from "lucide-react";
import { ProgressDistributionChart } from './analytics/ProgressDistributionChart';
import { StudentProgressChart } from './analytics/StudentProgressChart';
import { TimeProgressChart } from './analytics/TimeProgressChart';
import { ContributorActivityChart } from './analytics/ContributorActivityChart';

interface AnalyticsHeaderProps {
  stats: {
    title: string;
    value: any;
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
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded ${
                stat.trend.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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
  const [currentView, setCurrentView] = useState('week');
  const [progressData, setProgressData] = useState<{ date: string; count: number }[]>([]);
  
  // Transform the data for the charts if available
  const timeProgress = data?.timeProgress?.map(item => ({
    date: item.date,
    count: Number(item.count) || 0
  })) || [];
  
  const stats = [
    {
      title: "Total Students",
      value: data?.studentProgress?.length || 0,
      description: "Students assigned to you",
      trend: "+2.5%"
    },
    {
      title: "Avg. Quality",
      value: data?.qualityDistribution?.length > 0 ? "Good" : "N/A",
      description: "Average memorization quality",
      trend: "+0.3"
    },
    {
      title: "Active Tasks",
      value: data?.contributorActivity?.length || 0,
      description: "Pending assignments",
      trend: "-2"
    },
    {
      title: "Revisions This Month",
      value: timeProgress.reduce((sum, item) => sum + item.count, 0),
      description: "Completed revisions",
      trend: "+15.2%"
    },
  ];

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">Error loading analytics data</p>
        </CardContent>
      </Card>
    );
  }
  
  // Format the quality distribution data for the chart
  const formattedQualityData = data?.qualityDistribution?.map(item => ({
    name: item.quality,
    value: Number(item.count) || 0
  })) || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <AnalyticsHeader stats={stats} />
      
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList>
          <TabsTrigger value="progress">Progress Overview</TabsTrigger>
          <TabsTrigger value="students">Student Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progress Distribution</CardTitle>
                <CardDescription>Memorization quality assessment</CardDescription>
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
                    <span>Measured in completed ayahs</span>
                    <div className="flex items-center gap-2 ml-auto">
                      <button 
                        onClick={() => setCurrentView('week')}
                        className={`text-xs px-2 py-0.5 rounded ${
                          currentView === 'week' ? 'bg-emerald-100 text-emerald-800' : 'text-muted-foreground'
                        }`}
                      >
                        Week
                      </button>
                      <button 
                        onClick={() => setCurrentView('month')}
                        className={`text-xs px-2 py-0.5 rounded ${
                          currentView === 'month' ? 'bg-emerald-100 text-emerald-800' : 'text-muted-foreground'
                        }`}
                      >
                        Month
                      </button>
                      <button 
                        onClick={() => setCurrentView('year')}
                        className={`text-xs px-2 py-0.5 rounded ${
                          currentView === 'year' ? 'bg-emerald-100 text-emerald-800' : 'text-muted-foreground'
                        }`}
                      >
                        Year
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
              <CardTitle>Student Progress Comparison</CardTitle>
              <CardDescription>Top performing students this month</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <StudentProgressChart data={data?.studentProgress || []} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Patterns</CardTitle>
              <CardDescription>When students are most active</CardDescription>
            </CardHeader>
            <CardContent>
              <ContributorActivityChart data={data?.contributorActivity || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
