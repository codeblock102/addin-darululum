import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { MessageCategory, MessageType } from "@/types/progress";

interface AdminMessageFormProps {
  selectedTeacher: string;
  messageType: MessageType;
  messageCategory: MessageCategory;
}

export const AdminMessageForm = ({ 
  selectedTeacher, 
  messageType, 
  messageCategory 
}: AdminMessageFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // Create message from admin to teacher
      const { data, error } = await supabase
        .from('communications')
        .insert([
          {
            sender_id: null, // Admin doesn't have a UUID in the teachers table
            recipient_id: selectedTeacher, // Store teacher ID directly in recipient_id
            message: messageText,
            read: false,
            message_type: messageType,
            category: messageCategory,
            message_status: 'sent'
            // No longer using parent_message_id field
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sent-messages'] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      setNewMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher) {
      toast({
        title: "Error",
        description: "Please select a recipient.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate(newMessage);
  };

  return (
    <form onSubmit={handleSendMessage} className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <textarea
            className="w-full min-h-[150px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={sendMessageMutation.isPending || !selectedTeacher || !newMessage.trim()}
        >
          {sendMessageMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
