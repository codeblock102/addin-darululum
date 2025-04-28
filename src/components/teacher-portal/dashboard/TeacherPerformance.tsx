
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Calendar, ClipboardList } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  
  const chartData = {
    labels: getLast4WeeksLabels(),
    datasets: [
      {
        label: 'Progress Entries',
        data: getWeekData(progressData || []),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
      {
        label: 'Dhor Book Entries',
        data: getWeekData(dhorBookData || []),
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        borderColor: 'rgb(255, 159, 64)',
        borderWidth: 1,
      },
      {
        label: 'Attendance Records',
        data: getWeekData(attendanceData || []),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Teacher Activity (Last 4 Weeks)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Progress Entries</span>
                </div>
                <span className="font-bold">{totalProgress}</span>
              </div>
              <Progress value={(totalProgress / (totalRecords || 1)) * 100} className="bg-muted h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Dhor Book Entries</span>
                </div>
                <span className="font-bold">{totalDhor}</span>
              </div>
              <Progress value={(totalDhor / (totalRecords || 1)) * 100} className="bg-muted h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Attendance Records</span>
                </div>
                <span className="font-bold">{totalAttendance}</span>
              </div>
              <Progress value={(totalAttendance / (totalRecords || 1)) * 100} className="bg-muted h-2" />
            </div>
          </div>
          
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
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
