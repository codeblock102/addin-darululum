import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { DailyActivityEntry } from "@/types/dhor-book.ts";
import { Tables } from "@/integrations/supabase/types.ts";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ProgressChartsProps {
  progressData: DailyActivityEntry[];
  sabaqParaData: Tables<"sabaq_para">[];
  juzRevisionsData: Tables<"juz_revisions">[];
}

export const ProgressCharts = ({
  progressData,
}: ProgressChartsProps) => {
  // Transform data for chart visualization
  const chartData = progressData.map((entry) => {
    const versesMemorized = (entry.end_ayat && entry.start_ayat)
      ? (entry.end_ayat - entry.start_ayat + 1)
      : 0;
    return {
      date: entry.entry_date,
      verses: versesMemorized,
      juz: entry.current_juz || 0,
      surah: entry.current_surah || 0,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="verses" fill="#8884d8" name="Verses Memorized" />
              <Bar dataKey="juz" fill="#82ca9d" name="Current Juz" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
