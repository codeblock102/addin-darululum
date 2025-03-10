
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProgressStats } from "@/components/progress/ProgressStats";
import { ProgressTable } from "@/components/progress/ProgressTable";
import { NewProgressDialog } from "@/components/progress/NewProgressDialog";
import { RecentRevisions } from "@/components/progress/RecentRevisions";
import { CompleteRevisions } from "@/components/progress/CompleteRevisions";
import { useToast } from "@/hooks/use-toast";
import type { Progress } from "@/types/progress";

const Progress = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Set up real-time listener for progress updates
  useEffect(() => {
    const channel = supabase
      .channel('progress-page-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'progress'
        },
        (payload) => {
          console.log('Real-time progress update received:', payload);
          
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['progress'] });
          
          // Show notification
          let eventType = "";
          if (payload.eventType === "INSERT") eventType = "added";
          if (payload.eventType === "UPDATE") eventType = "updated";
          if (payload.eventType === "DELETE") eventType = "deleted";
          
          toast({
            title: "Progress Updated",
            description: `A progress entry was ${eventType}. The data has been refreshed.`,
            duration: 3000,
          });
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const { data: progressData, isLoading } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress')
        .select(`
          *,
          students(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Progress[];
    },
  });

  const calculateOverallProgress = () => {
    if (!progressData?.length) return 0;
    const totalStudents = progressData.length;
    const onTrackStudents = progressData.filter(
      (p) => p.memorization_quality === 'excellent' || p.memorization_quality === 'good'
    ).length;
    return Math.round((onTrackStudents / totalStudents) * 100);
  };

  const getStudentsOnTrack = () => {
    if (!progressData?.length) return 0;
    return progressData.filter(
      (p) => p.memorization_quality === 'excellent' || p.memorization_quality === 'good'
    ).length;
  };

  const getStudentsNeedingReview = () => {
    if (!progressData?.length) return 0;
    return progressData.filter(
      (p) => p.memorization_quality === 'needsWork' || p.memorization_quality === 'horrible'
    ).length;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Progress Tracking</h1>
            <p className="text-gray-500">Monitor student Hifz progress and revisions</p>
          </div>
          <NewProgressDialog />
        </div>

        <ProgressStats 
          totalStudents={progressData?.length || 0}
          onTrackCount={getStudentsOnTrack()}
          needsReviewCount={getStudentsNeedingReview()}
          overallProgress={calculateOverallProgress()}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <RecentRevisions />
          <CompleteRevisions />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ProgressTable data={progressData || []} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Progress;
