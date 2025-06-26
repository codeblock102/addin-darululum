import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TimeProgressChartProps {
  data: { date: string; count: number }[];
  timeRange?: "week" | "month" | "year";
}

export const TimeProgressChart: React.FC<TimeProgressChartProps> = ({
  data,
  timeRange = "month",
}) => {
  // Format dates based on timeRange
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);

    switch (timeRange) {
      case "week":
        return date.toLocaleDateString(undefined, { weekday: "short" });
      case "year":
        return date.toLocaleDateString(undefined, { month: "short" });
      case "month":
      default:
        return date.toLocaleDateString(undefined, { day: "2-digit" });
    }
  };

  // Process data to have formatted dates
  const processedData = data.map((item) => ({
    ...item,
    formattedDate: formatDateForDisplay(item.date),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={processedData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
