
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/types/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

interface ProgressChartsProps {
  progressData: Progress[];
  dhorData: any[];
}

export function ProgressCharts({ progressData, dhorData }: ProgressChartsProps) {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("all");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // Process progress data for visualization
  const chartData = processChartData(progressData, dhorData, timeRange);
  
  // Data for dhor performance comparison
  const dhorPerformanceData = processDhorPerformanceData(dhorData);

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Progress Visualization</CardTitle>
            <CardDescription>Performance metrics over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md overflow-hidden mr-2">
              <Button
                variant={chartType === "bar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("bar")}
                className="rounded-none h-8"
              >
                Bar
              </Button>
              <Button
                variant={chartType === "line" ? "default" : "ghost"}
                size="sm"
                onClick={() => setChartType("line")}
                className="rounded-none h-8"
              >
                Line
              </Button>
            </div>
            
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={timeRange === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("week")}
                className="rounded-none h-8"
              >
                Week
              </Button>
              <Button
                variant={timeRange === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("month")}
                className="rounded-none h-8"
              >
                Month
              </Button>
              <Button
                variant={timeRange === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange("all")}
                className="rounded-none h-8"
              >
                All
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="progress">Memorization Progress</TabsTrigger>
            <TabsTrigger value="dhor">Dhor Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="progress" className="mt-0">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 12 }}
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)", 
                        borderRadius: "8px", 
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)", 
                        border: "1px solid #eee" 
                      }}
                      formatter={(value, name) => [value, name.replace('_', ' ')]}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar 
                      name="Verses Memorized" 
                      dataKey="verses_memorized" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 12 }}
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)", 
                        borderRadius: "8px", 
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)", 
                        border: "1px solid #eee" 
                      }}
                      formatter={(value, name) => [value, name.replace('_', ' ')]}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line 
                      name="Verses Memorized"
                      type="monotone" 
                      dataKey="verses_memorized" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      name="Cumulative Verses"
                      type="monotone" 
                      dataKey="cumulative_verses" 
                      stroke="#0EA5E9" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="dhor" className="mt-0">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dhorPerformanceData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 12 }}
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)", 
                      borderRadius: "8px", 
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)", 
                      border: "1px solid #eee" 
                    }}
                    formatter={(value, name) => [value, name.replace('_', ' ')]}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    name="Dhor 1 Mistakes" 
                    dataKey="dhor_1_mistakes" 
                    fill="#F97316" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    name="Dhor 2 Mistakes" 
                    dataKey="dhor_2_mistakes" 
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Process chart data function
function processChartData(progressData: Progress[], dhorData: any[], timeRange: string) {
  // Get the cutoff date based on the selected time range
  const now = new Date();
  let cutoffDate = new Date();
  
  if (timeRange === "week") {
    cutoffDate.setDate(now.getDate() - 7);
  } else if (timeRange === "month") {
    cutoffDate.setMonth(now.getMonth() - 1);
  } else {
    // For "all", use a very old date to include everything
    cutoffDate = new Date(0);
  }
  
  // Filter data based on the time range
  const filteredProgressData = progressData.filter(entry => 
    entry.date && new Date(entry.date) >= cutoffDate
  );
  
  // Process the data for the chart
  let cumulativeVerses = 0;
  return filteredProgressData.map(entry => {
    cumulativeVerses += entry.verses_memorized || 0;
    
    return {
      date: entry.date ? new Date(entry.date).toLocaleDateString() : 'Unknown',
      verses_memorized: entry.verses_memorized || 0,
      cumulative_verses: cumulativeVerses,
      quality_score: getQualityScore(entry.memorization_quality),
    };
  });
}

// Process dhor performance data
function processDhorPerformanceData(dhorData: any[]) {
  return dhorData.map(entry => ({
    date: entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : 'Unknown',
    dhor_1_mistakes: entry.dhor_1_mistakes || 0,
    dhor_2_mistakes: entry.dhor_2_mistakes || 0,
  }));
}

// Helper to convert quality rating to a score
function getQualityScore(quality?: string) {
  switch (quality) {
    case 'excellent': return 5;
    case 'good': return 4;
    case 'average': return 3;
    case 'needsWork': return 2;
    case 'horrible': return 1;
    default: return 0;
  }
}
