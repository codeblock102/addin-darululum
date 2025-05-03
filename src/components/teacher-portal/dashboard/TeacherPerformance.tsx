
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TeacherPerformanceProps {
  teacherId: string;
}

// Define explicit types for the performance data
interface PerformanceData {
  date: string;
  students_taught: number;
  progress_entries: number;
  attendance_records: number;
}

export const TeacherPerformance = ({ teacherId }: TeacherPerformanceProps) => {
  // Sample data - in a real app, you would fetch this from the API
  const performanceData: PerformanceData[] = [
    {
      date: "Jan",
      students_taught: 12,
      progress_entries: 32,
      attendance_records: 24,
    },
    {
      date: "Feb",
      students_taught: 15,
      progress_entries: 40,
      attendance_records: 30,
    },
    {
      date: "Mar",
      students_taught: 18,
      progress_entries: 45,
      attendance_records: 35,
    },
    {
      date: "Apr",
      students_taught: 20,
      progress_entries: 55,
      attendance_records: 40,
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20">
          <CardTitle className="text-purple-700 dark:text-purple-300">Teacher Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.95)", 
                    borderRadius: "8px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)", 
                    border: "1px solid #eee" 
                  }} 
                />
                <Legend />
                <Bar name="Students Taught" dataKey="students_taught" fill="#8B5CF6" />
                <Bar name="Progress Entries" dataKey="progress_entries" fill="#F59E0B" />
                <Bar name="Attendance Records" dataKey="attendance_records" fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
