
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Loader2, BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";

interface AnalyticsProps {
  teacherId: string;
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const TeacherAnalytics = ({ teacherId }: AnalyticsProps) => {
  const [timeRange, setTimeRange] = useState("30");
  
  // Fetch student progress data
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['teacher-analytics-progress', teacherId, timeRange],
    queryFn: async () => {
      // First get student IDs assigned to this teacher
      const { data: studentsData, error: studentsError } = await supabase
        .from('students_teachers')
        .select('student_name')
        .eq('teacher_id', teacherId)
        .eq('active', true);
      
      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return { qualityDistribution: [], progressOverTime: [], memorizedPerStudent: [] };
      }
      
      if (!studentsData.length) {
        return { qualityDistribution: [], progressOverTime: [], memorizedPerStudent: [] };
      }
      
      // Get all student names
      const studentNames = studentsData.map(s => s.student_name);
      
      // Fetch progress data for these students within the time range
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const { data: allProgress, error: progressError } = await supabase
        .from('progress')
        .select('id, student_id, memorization_quality, verses_memorized, date, created_at, students(name)')
        .in('student_id', studentNames)
        .gte('created_at', startDate.toISOString());
      
      if (progressError) {
        console.error('Error fetching progress data:', progressError);
        return { qualityDistribution: [], progressOverTime: [], memorizedPerStudent: [] };
      }
      
      // Prepare data for quality distribution chart
      const qualityCount = {
        excellent: 0,
        good: 0,
        average: 0,
        needsWork: 0,
        horrible: 0
      };
      
      allProgress.forEach((entry) => {
        if (entry.memorization_quality) {
          qualityCount[entry.memorization_quality as keyof typeof qualityCount]++;
        }
      });
      
      const qualityDistribution = Object.keys(qualityCount).map(key => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: qualityCount[key as keyof typeof qualityCount]
      }));
      
      // Prepare data for progress over time chart
      const progressByDate: Record<string, { date: string; count: number }> = {};
      allProgress.forEach((entry) => {
        const date = new Date(entry.created_at).toLocaleDateString();
        if (!progressByDate[date]) {
          progressByDate[date] = { date, count: 0 };
        }
        progressByDate[date].count++;
      });
      
      const progressOverTime = Object.values(progressByDate).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Prepare data for memorized per student chart
      const versesPerStudent: Record<string, number> = {};
      allProgress.forEach((entry) => {
        const studentName = entry.students?.name || "Unknown";
        if (!versesPerStudent[studentName]) {
          versesPerStudent[studentName] = 0;
        }
        versesPerStudent[studentName] += entry.verses_memorized || 0;
      });
      
      const memorizedPerStudent = Object.keys(versesPerStudent).map(name => ({
        name,
        verses: versesPerStudent[name]
      })).sort((a, b) => b.verses - a.verses).slice(0, 10); // Top 10 students
      
      return {
        qualityDistribution,
        progressOverTime,
        memorizedPerStudent
      };
    }
  });
  
  // Generate a custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.fill || item.color }}>
              {`${item.name}: ${item.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Visualize student progress and performance metrics
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-48">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Time range" />
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
          </div>
        </CardHeader>
        <CardContent>
          {progressLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading analytics data...</span>
            </div>
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="quality">Quality Distribution</TabsTrigger>
                <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
                <TabsTrigger value="students">Student Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center">
                        <PieChartIcon className="h-4 w-4 mr-2" />
                        Memorization Quality Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {progressData?.qualityDistribution.length ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={progressData.qualityDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {progressData.qualityDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          No data available for the selected time period
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center">
                        <LineChartIcon className="h-4 w-4 mr-2" />
                        Progress Entries Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {progressData?.progressOverTime.length ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={progressData.progressOverTime}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                  const date = new Date(value);
                                  return date.getDate() + '/' + (date.getMonth() + 1);
                                }}
                              />
                              <YAxis />
                              <Tooltip content={<CustomTooltip />} />
                              <Line 
                                type="monotone" 
                                dataKey="count" 
                                name="Progress Entries"
                                stroke="#8884d8" 
                                activeDot={{ r: 8 }} 
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          No data available for the selected time period
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="quality">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Memorization Quality Distribution</CardTitle>
                    <CardDescription>
                      Distribution of evaluation grades across all students
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {progressData?.qualityDistribution.length ? (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={progressData.qualityDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {progressData.qualityDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No quality data available for the selected time period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="progress">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Progress Entries Over Time</CardTitle>
                    <CardDescription>
                      Number of progress entries recorded per day
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {progressData?.progressOverTime.length ? (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={progressData.progressOverTime}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              name="Progress Entries"
                              stroke="#8884d8" 
                              strokeWidth={2}
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No progress data available for the selected time period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Verses Memorized by Student</CardTitle>
                    <CardDescription>
                      Total verses memorized by each student in the selected time period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {progressData?.memorizedPerStudent.length ? (
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={progressData.memorizedPerStudent}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              tick={{ fontSize: 12 }}
                              width={150}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar 
                              dataKey="verses" 
                              name="Verses Memorized"
                              fill="#82ca9d"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        No student comparison data available for the selected time period
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
