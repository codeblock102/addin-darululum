
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";

export const useRealtimeAnalytics = (teacherId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!teacherId) return;
    
    // Set up subscription for progress table updates
    const progressChannel = supabase
      .channel('analytics-progress-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'progress'
        },
        (payload) => {
          console.log('Real-time progress update received:', payload);
          
          // Invalidate the query to fetch fresh data
          queryClient.invalidateQueries({ queryKey: ['teacher-analytics', teacherId] });
          queryClient.invalidateQueries({ queryKey: ['teacher-summary', teacherId] });
          
          // Show toast notification about the update
          toast({
            title: "Data Updated",
            description: "Progress data has been refreshed in real-time.",
            duration: 3000,
          });
        }
      )
      .subscribe();
    
    // Set up subscription for revisions table updates
    const revisionsChannel = supabase
      .channel('analytics-revisions-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'juz_revisions'
        },
        (payload) => {
          console.log('Real-time revision update received:', payload);
          
          // Invalidate the query to fetch fresh data
          queryClient.invalidateQueries({ queryKey: ['teacher-analytics', teacherId] });
          queryClient.invalidateQueries({ queryKey: ['teacher-summary', teacherId] });
          
          // Show toast notification about the update
          toast({
            title: "Data Updated",
            description: "Revision data has been refreshed in real-time.",
            duration: 3000,
          });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(revisionsChannel);
    };
  }, [teacherId, queryClient, toast]);
  
  return {};
};
