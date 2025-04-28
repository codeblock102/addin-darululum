
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Send, X } from "lucide-react";
import { Message } from "@/types/progress";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";

interface AdminMessageReplyProps {
  message: Message | null;
  onClose: () => void;
}

export const AdminMessageReply = ({
  message,
  onClose
}: AdminMessageReplyProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState("");

  const sendReplyMutation = useMutation({
    mutationFn: async (reply: string) => {
      if (!message) throw new Error("No message to reply to");
      
      const { data, error } = await supabase
        .from('communications')
        .insert([
          {
            sender_id: null, // Admin doesn't have a UUID in the teachers table
            recipient_id: message.sender_id, // Send to the original sender
            parent_message_id: message.parent_message_id || message.id, // Keep the thread connected
            message: reply,
            read: false,
            message_type: 'direct',
            category: message.category || 'administrative',
            message_status: 'sent'
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-responses'] });
      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully.",
      });
      setReplyText("");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send reply: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reply message.",
        variant: "destructive",
      });
      return;
    }
    
    sendReplyMutation.mutate(replyText);
  };

  if (!message) return null;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">Reply to {message.sender_name || "Teacher"}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="bg-muted p-3 rounded-md mb-4">
          <p className="text-sm text-muted-foreground">Original message:</p>
          <p className="text-sm">{message.message}</p>
        </div>
        <form onSubmit={handleSendReply}>
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[150px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          onClick={handleSendReply}
          disabled={sendReplyMutation.isPending || !replyText.trim()}
        >
          {sendReplyMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Reply
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
