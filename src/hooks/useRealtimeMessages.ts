
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useRealtimeMessages = (teacherId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!teacherId) return;
    
    // Set up subscription for new messages
    const messagesChannel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'communications',
          filter: `recipient_id=eq.${teacherId}`
        },
        (payload) => {
          console.log('Real-time message update received:', payload);
          
          // Invalidate the queries to fetch fresh data
          queryClient.invalidateQueries({ queryKey: ['teacher-inbox', teacherId] });
          
          // Show toast notification for new messages
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Message",
              description: "You have received a new message.",
              duration: 5000,
            });
          }
        }
      )
      .subscribe();
      
    // Set up subscription for message status changes (read/unread)
    const statusChannel = supabase
      .channel('message-status-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'communications',
          filter: `sender_id=eq.${teacherId}`
        },
        (payload) => {
          console.log('Message status update received:', payload);
          
          // Invalidate sent messages query to refresh read status
          queryClient.invalidateQueries({ queryKey: ['teacher-sent', teacherId] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [teacherId, queryClient, toast]);
  
  return {};
};
