
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { BarChart2, Calendar, ClipboardList } from "lucide-react";

interface TeacherPerformanceProps {
  teacherId: string;
}

export const TeacherPerformance = ({ teacherId }: TeacherPerformanceProps) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get progress records by the teacher
  const { data: progressData } = useQuery({
    queryKey: ['teacher-progress-data', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select('id, date')
        .eq('contributor_id', teacherId)
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      if (error) {
        console.error('Error fetching progress data:', error);
        return [];
      }
      
      return data;
    }
  });
  
  // Get dhor book entries by the teacher
  const { data: dhorBookData } = useQuery({
    queryKey: ['teacher-dhor-data', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dhor_book_entries')
        .select('id, entry_date')
        .eq('teacher_id', teacherId)
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      if (error) {
        console.error('Error fetching dhor book data:', error);
        return [];
      }
      
      return data;
    }
  });
  
  // Get attendance records by the teacher
  const { data: attendanceData } = useQuery({
    queryKey: ['teacher-attendance-data', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('id, date')
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      if (error) {
        console.error('Error fetching attendance data:', error);
        return [];
      }
      
      return data;
    }
  });
  
  // Calculate metrics
  const totalProgress = progressData?.length || 0;
  const totalDhor = dhorBookData?.length || 0;
  const totalAttendance = attendanceData?.length || 0;
  const totalRecords = totalProgress + totalDhor + totalAttendance;

  // Group data by week for chart
  const getLast4WeeksLabels = () => {
    const labels = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      labels.push(`${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    }
    
    return labels;
  };
  
  const getWeekNumber = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.floor(days / 7);
  };
  
  const getWeekData = (data: any[]) => {
    const weekCounts = [0, 0, 0, 0]; // Last 4 weeks
    
    data?.forEach(item => {
      const date = new Date(item.date || item.entry_date);
      const weekNum = getWeekNumber(date);
      
      if (weekNum >= 0 && weekNum < 4) {
        weekCounts[3 - weekNum]++; // Reverse to show oldest to newest
      }
    });
    
    return weekCounts;
  };
  
  // Prepare chart data using recharts format
  const chartData = getLast4WeeksLabels().map((label, index) => ({
    name: label,
    Progress: getWeekData(progressData || [])[index] || 0,
    Dhor: getWeekData(dhorBookData || [])[index] || 0,
    Attendance: getWeekData(attendanceData || [])[index] || 0
  }));
  
  return (
    <div className="space-y-6">
      <Card className="border border-purple-100 dark:border-purple-900/30 shadow-sm">
        <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <BarChart2 className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium">Progress Entries</span>
                </div>
                <span className="font-bold">{totalProgress}</span>
              </div>
              <Progress value={(totalProgress / (totalRecords || 1)) * 100} className="bg-muted h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium">Dhor Book Entries</span>
                </div>
                <span className="font-bold">{totalDhor}</span>
              </div>
              <Progress value={(totalDhor / (totalRecords || 1)) * 100} className="bg-muted h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Attendance Records</span>
                </div>
                <span className="font-bold">{totalAttendance}</span>
              </div>
              <Progress value={(totalAttendance / (totalRecords || 1)) * 100} className="bg-muted h-2" />
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3" />
                <XAxis dataKey="name" scale="band" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Progress" fill="#4ade80" name="Progress Entries" />
                <Bar dataKey="Dhor" fill="#fbbf24" name="Dhor Book" />
                <Bar dataKey="Attendance" fill="#60a5fa" name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border border-purple-100 dark:border-purple-900/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-purple-700 dark:text-purple-300">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="bg-purple-50 dark:bg-purple-900/20">
              <TabsTrigger value="all">All Activity</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="dhor">Dhor Book</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                Detailed activity timeline will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="progress" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                Progress activity timeline will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="dhor" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                Dhor Book activity timeline will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="attendance" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                Attendance activity timeline will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
