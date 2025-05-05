
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StudentPerformanceMetricsProps {
  studentId: string;
}

export const StudentPerformanceMetrics = ({ studentId }: StudentPerformanceMetricsProps) => {
  // Fetch Dhor Book entries for the student
  const { data: dhorEntries, isLoading: dhorLoading } = useQuery({
    queryKey: ['dhor-entries-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dhor_book_entries')
        .select('*')
        .eq('student_id', studentId)
        .order('entry_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Fetch attendance records
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  // Fetch progress entries
  const { data: progressEntries, isLoading: progressLoading } = useQuery({
    queryKey: ['progress-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId,
  });

  const isLoading = dhorLoading || attendanceLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate metrics
  const totalEntries = dhorEntries?.length || 0;
  const totalPoints = dhorEntries?.reduce((sum, entry) => sum + entry.points, 0) || 0;
  const averagePoints = totalEntries > 0 ? (totalPoints / totalEntries).toFixed(1) : '0';
  
  const totalPresent = attendanceRecords?.filter(record => record.status === 'present').length || 0;
  const attendanceRate = attendanceRecords?.length 
    ? Math.round((totalPresent / attendanceRecords.length) * 100) 
    : 0;

  const lastEntry = dhorEntries?.length ? dhorEntries[0].entry_date : null;
  
  const totalMistakes = dhorEntries?.reduce((sum, entry) => 
    sum + entry.dhor_1_mistakes + entry.dhor_2_mistakes, 0) || 0;
  
  // Simple trend calculation based on last 10 entries
  const calculateTrend = () => {
    if (!dhorEntries || dhorEntries.length < 5) return 'unknown';
    
    const recentEntries = dhorEntries.slice(0, Math.min(10, dhorEntries.length));
    const recentPoints = recentEntries.map(entry => entry.points);
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 0; i < recentPoints.length - 1; i++) {
      if (recentPoints[i] > recentPoints[i+1]) increasing++;
      else if (recentPoints[i] < recentPoints[i+1]) decreasing++;
    }
    
    if (increasing > decreasing + 2) return 'improving';
    if (decreasing > increasing + 2) return 'declining';
    return 'steady';
  };
  
  const progressTrend = calculateTrend();
  
  // Get current and completed juz from progress records
  const latestProgress = progressEntries?.length ? progressEntries[0] : null;
  const currentJuz = latestProgress?.current_juz || 0;
  const completedJuz = latestProgress?.completed_juz || 0;

  // Render trend icon based on progress trend
  const renderTrendIcon = () => {
    switch (progressTrend) {
      case 'improving':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Average Points</div>
          <div className="text-2xl font-bold mt-1">{averagePoints}</div>
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            {renderTrendIcon()}
            <span className="ml-1">from {totalEntries} entries</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Attendance Rate</div>
          <div className="text-2xl font-bold mt-1">{attendanceRate}%</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {totalPresent} of {attendanceRecords?.length || 0} days present
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Mistakes</div>
          <div className="text-2xl font-bold mt-1">{totalMistakes}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Avg: {totalEntries > 0 ? (totalMistakes / totalEntries).toFixed(1) : '0'} per entry
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Juz Progress</div>
          <div className="text-2xl font-bold mt-1">{completedJuz} / 30</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Currently on Juz {currentJuz || 'N/A'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
