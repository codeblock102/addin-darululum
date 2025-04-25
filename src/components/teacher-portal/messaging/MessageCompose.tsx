
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageCategory, MessageRecipient, MessageType } from "@/types/progress";

interface MessageComposeProps {
  teacherId: string;
  teacherName: string;
  recipients: MessageRecipient[];
  recipientsLoading: boolean;
}

export const MessageCompose = ({
  teacherId,
  teacherName,
  recipients,
  recipientsLoading
}: MessageComposeProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>("academic");

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      recipient_id: string;
      message: string;
      message_type: MessageType;
      category: MessageCategory;
    }) => {
      const { data, error } = await supabase
        .from('communications')
        .insert([
          {
            sender_id: teacherId,
            recipient_id: messageData.recipient_id,
            message: messageData.message,
            read: false,
            message_type: messageData.message_type,
            category: messageData.category,
            message_status: 'sent'
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-sent', teacherId] });
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
    
    if (!selectedRecipient) {
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
    
    sendMessageMutation.mutate({
      recipient_id: selectedRecipient,
      message: newMessage,
      message_type: messageType,
      category: messageCategory
    });
  };

  return (
    <form onSubmit={handleSendMessage} className="space-y-4">
      <div className="space-y-2">
        <Label>Recipient</Label>
        <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {recipientsLoading ? (
              <div className="flex justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : recipients && recipients.length > 0 ? (
              recipients.map((recipient) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  {recipient.name} ({recipient.type})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-recipients" disabled>No recipients available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Message Type</Label>
          <Select value={messageType} onValueChange={(value) => setMessageType(value as MessageType)}>
            <SelectTrigger>
              <SelectValue placeholder="Message type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={messageCategory} onValueChange={(value) => setMessageCategory(value as MessageCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Message category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="administrative">Administrative</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Message</Label>
        <div className="relative">
          <textarea
            className="w-full min-h-[200px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={sendMessageMutation.isPending || !selectedRecipient || !newMessage.trim()}
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
