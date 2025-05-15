
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRealtimeLeaderboard(teacherId?: string, refreshCallback?: () => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!teacherId) return;

    // Set up subscriptions for all three tables: progress, sabaq_para, and juz_revisions
    const progressChannel = supabase
      .channel('leaderboard-progress-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress'
        },
        (payload) => {
          console.log('Progress change detected:', payload);
          // Invalidate the leaderboard queries to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          
          // Call additional refresh callback if provided
          if (refreshCallback) {
            refreshCallback();
          }
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Progress Entry",
              description: "Leaderboard updated with new progress entry.",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    const sabaqParaChannel = supabase
      .channel('leaderboard-sabaq-para-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sabaq_para'
        },
        (payload) => {
          console.log('Sabaq Para change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          
          // Call additional refresh callback if provided
          if (refreshCallback) {
            refreshCallback();
          }
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Sabaq Para Entry",
              description: "Leaderboard updated with new Sabaq Para entry.",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    const juzRevisionsChannel = supabase
      .channel('leaderboard-juz-revisions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'juz_revisions'
        },
        (payload) => {
          console.log('Juz Revisions change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          
          // Call additional refresh callback if provided
          if (refreshCallback) {
            refreshCallback();
          }
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Revision Entry",
              description: "Leaderboard updated with new Revision entry.",
              duration: 3000,
            });
          }
        }
      )
      .subscribe();

    // Clean up subscriptions when component unmounts
    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(sabaqParaChannel);
      supabase.removeChannel(juzRevisionsChannel);
    };
  }, [teacherId, queryClient, toast, refreshCallback]);

  return {};
}
