
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/types/progress";
import { Tables } from "@/integrations/supabase/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export interface ProgressChartsProps {
  progressData: Progress[];
  sabaqParaData: Tables<"sabaq_para">[];
  juzRevisionsData: Tables<"juz_revisions">[];
}

export const ProgressCharts = ({ 
  progressData, 
  sabaqParaData, 
  juzRevisionsData 
}: ProgressChartsProps) => {
  // Transform data for chart visualization
  const chartData = progressData.map(entry => ({
    date: entry.date || new Date(entry.created_at).toLocaleDateString(),
    verses: entry.verses_memorized || 0,
    juz: entry.current_juz || 0,
    surah: entry.current_surah || 0
  }));

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
