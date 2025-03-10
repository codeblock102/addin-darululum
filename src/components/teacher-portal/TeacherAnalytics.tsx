
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressDistributionChart } from "./analytics/ProgressDistributionChart";
import { StudentProgressChart } from "./analytics/StudentProgressChart";
import { TimeProgressChart } from "./analytics/TimeProgressChart";
import { Loader2 } from "lucide-react";

interface TeacherAnalyticsProps {
  teacherId: string;
}

export const TeacherAnalytics = ({ teacherId }: TeacherAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState("30");
  
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['teacher-analytics', teacherId, timeRange],
    queryFn: async () => {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Fetch progress data
      const { data: progressData, error: progressError } = await supabase
        .from('progress')
        .select(`
          id,
          memorization_quality,
          verses_memorized,
          created_at,
          students (
            name
          )
        `)
        .gte('created_at', startDate.toISOString());
      
      if (progressError) {
        console.error('Error fetching progress:', progressError);
        return null;
      }
      
      // Process data for charts
      const qualityCount = {
        excellent: 0,
        good: 0,
        average: 0,
        needsWork: 0,
        horrible: 0
      };
      
      const studentVerses: Record<string, number> = {};
      const progressByDate: Record<string, number> = {};
      
      progressData.forEach((entry) => {
        // Quality distribution
        if (entry.memorization_quality) {
          qualityCount[entry.memorization_quality as keyof typeof qualityCount]++;
        }
        
        // Student progress
        const studentName = entry.students?.name || 'Unknown';
        studentVerses[studentName] = (studentVerses[studentName] || 0) + (entry.verses_memorized || 0);
        
        // Progress over time
        const date = new Date(entry.created_at).toLocaleDateString();
        progressByDate[date] = (progressByDate[date] || 0) + 1;
      });
      
      return {
        qualityDistribution: Object.entries(qualityCount).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value
        })),
        studentProgress: Object.entries(studentVerses)
          .map(([name, verses]) => ({ name, verses }))
          .sort((a, b) => b.verses - a.verses)
          .slice(0, 10),
        timeProgress: Object.entries(progressByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      };
    }
  });
  
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
        <CardHeader>
          <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View student progress and performance metrics
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <ProgressDistributionChart data={analyticsData?.qualityDistribution || []} />
            <TimeProgressChart data={analyticsData?.timeProgress || []} />
            <div className="md:col-span-2">
              <StudentProgressChart data={analyticsData?.studentProgress || []} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
