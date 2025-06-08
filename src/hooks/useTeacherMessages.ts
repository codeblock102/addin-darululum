import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Message, MessageRecipient } from "@/types/progress.ts";

interface MessageWithSender extends Message {
  teachers: { name: string } | null;
}

interface MessageWithRecipient extends Message {
  teachers: { name: string } | null;
}

export const useTeacherMessages = (teacherId: string) => {
  // Get regular direct messages to this teacher
  const { 
    data: inboxMessages, 
    isLoading: inboxLoading, 
    refetch: refetchInbox 
  } = useQuery({
    queryKey: ['teacher-inbox', teacherId],
    queryFn: async () => {
      // Get regular direct messages to this teacher
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, read_at, category, updated_at,
          teachers!communications_sender_id_fkey(name)
        `)
        .eq('recipient_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get admin messages sent to this teacher (where parent_message_id = teacherId)
      const { data: adminMessages, error: adminError } = await supabase
        .from('communications')
        .select('*')
        .is('sender_id', null)
        .eq('parent_message_id', teacherId)
        .order('created_at', { ascending: false });
        
      if (adminError) throw adminError;
      
      // Format regular messages
      const formattedMessages = data.map((msg: MessageWithSender) => ({
        ...msg,
        sender_name: msg.teachers?.name || "Unknown Sender"
      }));
      
      // Format admin messages
      const formattedAdminMessages = (adminMessages || []).map((msg: Message) => ({
        ...msg,
        sender_name: "Administrator",
        sender_id: null, // Admin sender
        recipient_id: teacherId // Set the recipient_id to this teacher's ID for consistent handling
      }));
      
      // Combine and sort all messages by date
      const allMessages = [...formattedMessages, ...formattedAdminMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      return allMessages;
    }
  });
  
  const { 
    data: sentMessages, 
    isLoading: sentLoading, 
    refetch: refetchSent 
  } = useQuery({
    queryKey: ['teacher-sent', teacherId],
    queryFn: async () => {
      // Get regular messages sent by this teacher
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, read_at, category, updated_at,
          teachers!communications_recipient_id_fkey(name)
        `)
        .eq('sender_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get messages sent to admin (where parent_message_id = 'admin-1')
      const { data: adminMessages, error: adminError } = await supabase
        .from('communications')
        .select('*')
        .eq('sender_id', teacherId)
        .not('parent_message_id', 'is', null)
        .order('created_at', { ascending: false });
        
      if (adminError) throw adminError;

      // Format regular messages
      const formattedMessages = data.map((msg: MessageWithRecipient) => ({
        ...msg,
        recipient_name: msg.teachers?.name || "Unknown Recipient"
      }));
      
      // Format admin messages
      const formattedAdminMessages = (adminMessages || []).map((msg: Message) => ({
        ...msg,
        recipient_name: "Administrator",
        recipient_id: msg.parent_message_id // Set the display recipient ID to the admin ID
      }));
      
      // Combine regular messages and admin messages
      const allMessages = [...formattedMessages, ...formattedAdminMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      return allMessages;
    }
  });

  const { 
    data: recipients, 
    isLoading: recipientsLoading 
  } = useQuery({
    queryKey: ['message-recipients', teacherId],
    queryFn: async () => {
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, name')
        .neq('id', teacherId);
      
      if (teachersError) throw teachersError;
      
      const formattedTeachers: MessageRecipient[] = teachers.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        type: "teacher" as const
      }));
      
      // Add admin recipient with special flag to handle differently
      const adminRecipients: MessageRecipient[] = [
        { 
          id: 'admin-1', 
          name: 'Administrator', 
          type: 'admin',
          isSpecial: true // Flag this as a special recipient that doesn't use UUID
        }
      ];
      
      return [...formattedTeachers, ...adminRecipients];
    }
  });

  const refetchMessages = () => {
    refetchInbox();
    refetchSent();
  };

  const unreadCount = inboxMessages?.filter(msg => !msg.read).length || 0;

  return {
    inboxMessages, 
    sentMessages, 
    recipients,
    inboxLoading, 
    sentLoading, 
    recipientsLoading,
    refetchMessages,
    unreadCount
  };
};
