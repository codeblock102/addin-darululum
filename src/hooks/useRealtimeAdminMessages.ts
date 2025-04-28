
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useRealtimeAdminMessages = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  useEffect(() => {
    // Set up subscription for admin messages (messages with recipient_id='admin-1')
    const adminMessagesChannel = supabase
      .channel('admin-messages-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'communications',
          filter: `recipient_id=eq.admin-1`
        },
        (payload) => {
          console.log('Admin message update received:', payload);
          
          // Invalidate the queries to fetch fresh data
          queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
          
          // Show toast notification for new messages
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Message",
              description: "You have received a new message from a teacher.",
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    // Set up subscription for admin responses (messages sent by admin)
    const adminResponsesChannel = supabase
      .channel('admin-responses-channel')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'communications',
          filter: `sender_id=is.null AND recipient_id=is.not.null`
        },
        (payload) => {
          console.log('Admin response update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-responses'] });
          queryClient.invalidateQueries({ queryKey: ['admin-sent-messages'] });
        }
      )
      .subscribe();
      
    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(adminMessagesChannel);
      supabase.removeChannel(adminResponsesChannel);
    };
  }, [queryClient, toast]);
  
  return {};
};
