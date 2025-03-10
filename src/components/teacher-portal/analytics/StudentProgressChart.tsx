
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudentProgressChartProps {
  data: Array<{
    name: string;
    verses: number;
  }>;
}

export const StudentProgressChart = ({ data }: StudentProgressChartProps) => {
  const [chartData, setChartData] = useState(data);

  // Set up real-time listener for progress updates
  useEffect(() => {
    // Initialize with passed data
    setChartData(data);
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'progress'
        },
        (payload) => {
          console.log('Real-time progress update received:', payload);
          // Simply trigger a refresh of data by using the latest data provided by props
          // The parent component (TeacherAnalytics) will fetch fresh data
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [data]);

  // Update chart data when props change
  useEffect(() => {
    setChartData(data);
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Verses Memorized by Student</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="verses" fill="#82ca9d" name="Verses Memorized" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
