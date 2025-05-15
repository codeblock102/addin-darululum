
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export function useRealtimeLeaderboard(teacherId?: string, refreshCallback?: () => void) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!teacherId) return;

    // Set up subscriptions for all three tables
    const dhorBookChannel = supabase
      .channel('leaderboard-dhor-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dhor_book_entries'
        },
        (payload) => {
          console.log('Dhor book entry change detected:', payload);
          // Invalidate the leaderboard queries to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          
          // Call additional refresh callback if provided
          if (refreshCallback) {
            refreshCallback();
          }
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Dhor Entry",
              description: "Leaderboard updated with new Dhor entry.",
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
      supabase.removeChannel(dhorBookChannel);
      supabase.removeChannel(sabaqParaChannel);
      supabase.removeChannel(juzRevisionsChannel);
    };
  }, [teacherId, queryClient, toast, refreshCallback]);

  return {};
}
