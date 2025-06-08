import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { UserIcon } from "lucide-react";

interface ContributorData {
  name: string;
  count: number;
  color?: string;
}

interface ContributorActivityChartProps {
  data: ContributorData[];
}

export const ContributorActivityChart = ({ data }: ContributorActivityChartProps) => {
  const defaultData = [
    { name: "Teacher A", count: 0, color: "#a855f7" },
    { name: "Teacher B", count: 0, color: "#ec4899" },
    { name: "Admin", count: 0, color: "#14b8a6" },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center">
          <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          Contributor Activity
        </CardTitle>
        <CardDescription>
          Progress entries by contributor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => `${value}`}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip
                cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Contributor
                            </span>
                            <span className="font-bold text-sm">{payload[0].payload.name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Entries
                            </span>
                            <span className="font-bold text-sm">{payload[0].payload.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                fill="currentColor"
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
