/**
 * Reusable Metric Chart Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface MetricChartProps {
  title: string;
  data: any[];
  type: "line" | "bar" | "pie";
  dataKey: string;
  xAxisKey?: string;
  lines?: Array<{ dataKey: string; name: string; stroke?: string }>;
  bars?: Array<{ dataKey: string; name: string; fill?: string }>;
  height?: number;
  className?: string;
}

export function MetricChart({
  title,
  data,
  type,
  dataKey,
  xAxisKey = "name",
  lines,
  bars,
  height = 300,
  className,
}: MetricChartProps) {
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {lines?.map((line, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.stroke || `#${((idx + 1) * 0x333333).toString(16).padStart(6, "0")}`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {bars?.map((bar, idx) => (
                <Bar
                  key={idx}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.fill || `#${((idx + 1) * 0x333333).toString(16).padStart(6, "0")}`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        const colors = ["#2563eb", "#059669", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No data available
          </div>
        ) : (
          renderChart()
        )}
      </CardContent>
    </Card>
  );
}

