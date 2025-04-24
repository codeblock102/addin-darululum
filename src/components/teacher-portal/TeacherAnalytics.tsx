
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsItem, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useRealtimeAnalytics } from "@/hooks/useRealtimeAnalytics";
import { AnalyticsHeader } from './analytics/AnalyticsHeader';
import { ProgressDistributionChart } from './analytics/ProgressDistributionChart';
import { StudentProgressChart } from './analytics/StudentProgressChart';
import { TimeProgressChart } from './analytics/TimeProgressChart';
import { ContributorActivityChart } from './analytics/ContributorActivityChart';

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const { data, isLoading, error } = useAnalyticsData(teacherId);
  const { realtimeData } = useRealtimeAnalytics(teacherId);
  const [currentView, setCurrentView] = useState('week');
  const [progressData, setProgressData] = useState<{ date: string; count: number }[]>([]);
  
  useEffect(() => {
    if (data && data.progressOverTime) {
      // Transform data to the required format for charts
      const transformedData = data.progressOverTime
        .filter(item => item.count !== null) // Filter out items with null counts
        .map(item => ({
          date: item.date,
          count: item.count as number // Type assertion to ensure it's a number
        }));
      
      setProgressData(transformedData);
    }
  }, [data]);
  
  const stats = [
    {
      title: "Total Students",
      value: data?.totalStudents || 0,
      description: "Students assigned to you",
      trend: "+2.5%"
    },
    {
      title: "Avg. Quality",
      value: data?.averageQuality || "N/A",
      description: "Average memorization quality",
      trend: "+0.3"
    },
    {
      title: "Active Tasks",
      value: data?.activeTasks || 0,
      description: "Pending assignments",
      trend: "-2"
    },
    {
      title: "Revisions This Month",
      value: data?.monthlyRevisions || 0,
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
                <ProgressDistributionChart data={data?.qualityDistribution || []} />
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
                <TimeProgressChart data={progressData} timeFrame={currentView} />
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
              <ContributorActivityChart data={data?.activityPatterns || []} />
            </CardContent>
          </Card>
          
          {/* Additional trend charts would go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
};
