
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card.tsx";

interface Progress {
  id: string;
  student_id: string;
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  date: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
}

interface StudentProgressChartProps {
  progress: Progress[];
}

export const StudentProgressChart = ({ progress }: StudentProgressChartProps) => {
  // Process data for the chart - last 10 entries, reversed for chronological order
  const chartData = progress
    .slice(0, 10)
    .reverse()
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString(),
      verses: entry.verses_memorized || 0,
      quality: entry.memorization_quality || 'average',
    }));

  // Calculate total verses memorized
  const totalVerses = progress.reduce((sum, entry) => sum + (entry.verses_memorized || 0), 0);
  
  // Get the latest entry for current position
  const latestEntry = progress[0];
  
  if (progress.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No progress data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700 font-medium">Total Verses</p>
          <p className="text-2xl font-bold">{totalVerses}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Current Position</p>
          <p className="text-2xl font-bold">
            Surah {latestEntry?.current_surah || '-'}, Juz {latestEntry?.current_juz || '-'}
          </p>
        </div>
      </div>
      
      {chartData.length > 1 ? (
        <div className="h-[140px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => value.split('/')[1] + '/' + value.split('/')[0]}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value, _name) => [value, 'Verses Memorized']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar 
                dataKey="verses" 
                name="Verses Memorized" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4 text-center text-gray-500">
            Need more entries to show a progress chart.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
