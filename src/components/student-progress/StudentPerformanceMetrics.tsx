import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface StudentPerformanceMetricsProps {
  studentId: string;
}

export const StudentPerformanceMetrics = ({ studentId }: StudentPerformanceMetricsProps) => {
  const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery<Tables<"attendance">[]>({
    queryKey: ['attendance-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance').select('*').eq('student_id', studentId);
      if (error) throw error; return data || [];
    },
    enabled: !!studentId,
  });

  const { data: progressEntries, isLoading: progressLoading } = useQuery<Tables<"progress">[]>({
    queryKey: ['progress-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('progress').select('*').eq('student_id', studentId).order('date', { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!studentId,
  });

  const { data: sabaqParaEntries, isLoading: sabaqParaLoading } = useQuery<Tables<"sabaq_para">[]>({
    queryKey: ['sabaq-para-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sabaq_para').select('*').eq('student_id', studentId).order('revision_date', { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!studentId,
  });

  const { data: juzRevisionsEntries, isLoading: juzRevisionsLoading } = useQuery<Tables<"juz_revisions">[]>({
    queryKey: ['juz-revisions-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('juz_revisions').select('*').eq('student_id', studentId).order('revision_date', { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!studentId,
  });

  const { data: studentData, isLoading: studentDataLoading } = useQuery<Tables<"students"> | null>({
    queryKey: ['student-data-metrics', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      if (error) {
        console.error("Error fetching student data for metrics:", error.message);
        return null; 
      }
      return data;
    },
    enabled: !!studentId,
  });

  const isLoading = attendanceLoading || progressLoading || sabaqParaLoading || juzRevisionsLoading || studentDataLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPresent = attendanceRecords?.filter(record => record.status === 'present').length || 0;
  const attendanceRate = attendanceRecords?.length 
    ? Math.round((totalPresent / attendanceRecords.length) * 100) 
    : 0;
  
  const latestProgress = progressEntries?.length ? progressEntries[0] : null;
  const currentJuz = latestProgress?.current_juz || 0;
  const completedJuz = latestProgress?.completed_juz || 0;

  // Calculate total memorized juz from the student's record
  const totalMemorizedJuzCount = Array.isArray(studentData?.completed_juz) 
    ? studentData.completed_juz.length 
    : 0;

  const totalSabaqParaEntries = sabaqParaEntries?.length || 0;
  const totalJuzRevisionsEntries = juzRevisionsEntries?.length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="text-sm font-medium text-muted-foreground">Total Memorized Juz</div>
          <div className="text-2xl font-bold mt-1">{totalMemorizedJuzCount} / 30</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Currently on Juz {currentJuz || 'N/A'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Sabaq Para Entries</div>
          <div className="text-2xl font-bold mt-1">{totalSabaqParaEntries}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Total recorded Sabaq Para sessions.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-medium text-muted-foreground">Dhor Revision Entries</div>
          <div className="text-2xl font-bold mt-1">{totalJuzRevisionsEntries}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Total recorded Dhor (Juz Revision) sessions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
