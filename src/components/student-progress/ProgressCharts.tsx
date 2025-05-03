
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Button } from '@/components/ui/button';
import { CalendarIcon, BarChart2Icon, LineChartIcon } from 'lucide-react';

interface ProgressData {
  date: string;
  sabaq?: number;
  sabaq_para?: number;
  dhor?: number;
  dhor2?: number;
}

interface AttendanceData {
  status: string;
  count: number;
}

interface ProgressChartsProps {
  progressData?: ProgressData[];
  attendanceData?: AttendanceData[];
  studentName?: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f43f5e', '#f59e0b'];
const ATTENDANCE_COLORS = {
  'present': '#22c55e',
  'absent': '#f43f5e',
  'late': '#f59e0b',
  'excused': '#3b82f6',
  // Add more status color mappings as needed
};

// Format tooltip labels properly for charts
const formatTooltipLabel = (value: string | number) => {
  // If value is a number, just return it
  if (typeof value === 'number') return value;
  
  // If it's a string (like a date), return as is
  return String(value);
};

export const ProgressCharts = ({ progressData = [], attendanceData = [], studentName }: ProgressChartsProps) => {
  const [viewType, setViewType] = useState<'bar' | 'line'>('bar');
  
  // Use sample data if no data is provided
  const sampleProgressData: ProgressData[] = [
    { date: '2025-04-01', sabaq: 5, sabaq_para: 3, dhor: 2, dhor2: 1 },
    { date: '2025-04-08', sabaq: 6, sabaq_para: 4, dhor: 3, dhor2: 2 },
    { date: '2025-04-15', sabaq: 4, sabaq_para: 5, dhor: 4, dhor2: 2 },
    { date: '2025-04-22', sabaq: 7, sabaq_para: 6, dhor: 5, dhor2: 3 },
    { date: '2025-04-29', sabaq: 8, sabaq_para: 7, dhor: 6, dhor2: 4 },
  ];

  const sampleAttendanceData: AttendanceData[] = [
    { status: 'present', count: 18 },
    { status: 'absent', count: 3 },
    { status: 'late', count: 2 },
    { status: 'excused', count: 1 },
  ];
  
  const chartData = progressData.length ? progressData : sampleProgressData;
  const attendanceChartData = attendanceData.length ? attendanceData : sampleAttendanceData;

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };
  
  const calculateAttendancePercentage = (status: string): string => {
    const total = attendanceChartData.reduce((sum, item) => sum + item.count, 0);
    const statusCount = attendanceChartData.find(item => item.status === status)?.count || 0;
    const percentage = (statusCount / total * 100).toFixed(1);
    return `${percentage}%`;
  };
  
  // Custom tooltip formatter for recharts
  const CustomTooltip = ({ active, payload, label }: TooltipProps<string | number, string>) => {
    if (active && payload && payload.length) {
      const formattedLabel = typeof label === 'string' ? formatDate(label) : label;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium">{formattedLabel}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Progress Charts */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Progress Overview</CardTitle>
            <div className="space-x-1">
              <Button 
                size="icon" 
                variant={viewType === 'bar' ? 'default' : 'outline'} 
                onClick={() => setViewType('bar')}
              >
                <BarChart2Icon className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant={viewType === 'line' ? 'default' : 'outline'} 
                onClick={() => setViewType('line')}
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sabaq">Sabaq</TabsTrigger>
                <TabsTrigger value="sabaq_para">Sabaq Para</TabsTrigger>
                <TabsTrigger value="dhor">Dhor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <ResponsiveContainer width="100%" height={300}>
                  {viewType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="sabaq" name="Sabaq" fill="#22c55e" />
                      <Bar dataKey="sabaq_para" name="Sabaq Para" fill="#3b82f6" />
                      <Bar dataKey="dhor" name="Dhor" fill="#f59e0b" />
                      <Bar dataKey="dhor2" name="Dhor 2" fill="#f43f5e" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate} 
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="sabaq" name="Sabaq" stroke="#22c55e" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="sabaq_para" name="Sabaq Para" stroke="#3b82f6" />
                      <Line type="monotone" dataKey="dhor" name="Dhor" stroke="#f59e0b" />
                      <Line type="monotone" dataKey="dhor2" name="Dhor 2" stroke="#f43f5e" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="sabaq">
                <ResponsiveContainer width="100%" height={300}>
                  {viewType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sabaq" name="Sabaq" fill="#22c55e" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="sabaq" name="Sabaq" stroke="#22c55e" activeDot={{ r: 8 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </TabsContent>
              
              {/* Similar TabsContent for sabaq_para and dhor - abbreviated for brevity */}
              {/* These would follow the same pattern as the "sabaq" tab */}
              <TabsContent value="sabaq_para">
                <ResponsiveContainer width="100%" height={300}>
                  {viewType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="sabaq_para" name="Sabaq Para" fill="#3b82f6" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="sabaq_para" name="Sabaq Para" stroke="#3b82f6" activeDot={{ r: 8 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="dhor">
                <ResponsiveContainer width="100%" height={300}>
                  {viewType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="dhor" name="Dhor" fill="#f59e0b" />
                      <Bar dataKey="dhor2" name="Dhor 2" fill="#f43f5e" />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="dhor" name="Dhor" stroke="#f59e0b" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="dhor2" name="Dhor 2" stroke="#f43f5e" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Attendance Pie Chart */}
        <Card className="w-full md:w-96">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                  label={({ name }) => `${name}: ${calculateAttendancePercentage(String(name))}`}
                >
                  {attendanceChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={ATTENDANCE_COLORS[entry.status as keyof typeof ATTENDANCE_COLORS] || COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 grid grid-cols-2 gap-2 w-full text-sm">
              {attendanceChartData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: ATTENDANCE_COLORS[entry.status as keyof typeof ATTENDANCE_COLORS] || COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="capitalize">{entry.status}: {entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
