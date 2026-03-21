/**
 * @file src/components/teacher-portal/messaging/MessageCompose.tsx
 * @summary Form for composing and sending messages to other users.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  MessageCategory,
  MessageRecipient,
  MessageType,
} from "@/types/progress.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";

interface MessageComposeProps {
  teacherId: string;
  recipients: MessageRecipient[];
  recipientsLoading: boolean;
  onSendSuccess?: () => void;
}

export const MessageCompose = ({
  teacherId,
  recipients,
  recipientsLoading,
  onSendSuccess,
}: MessageComposeProps) => {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>(
    "academic",
  );
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from("communications").insert({
        sender_id: teacherId,
        recipient_id: selectedRecipient,
        message: newMessage.trim(),
        message_type: messageType,
        category: messageCategory,
        read: false,
      });

      if (error) throw error;

      toast({ title: "Message sent successfully" });
      setNewMessage("");
      setSelectedRecipient("");
      if (onSendSuccess) onSendSuccess();
    } catch (err) {
      console.error("Failed to send message:", err);
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="space-y-4">
      <div className="space-y-2">
        <Label>Recipient</Label>
        <Select
          value={selectedRecipient}
          onValueChange={setSelectedRecipient}
          disabled={recipientsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {recipientsLoading ? (
              <div className="flex justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : recipients.length > 0 ? (
              recipients.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} ({r.type})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No recipients available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Message Type</Label>
          <Select
            value={messageType}
            onValueChange={(value) => setMessageType(value as MessageType)}
          >
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
          <Select
            value={messageCategory}
            onValueChange={(value) =>
              setMessageCategory(value as MessageCategory)}
          >
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
        <textarea
          className="w-full min-h-[200px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Type your message here..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!newMessage.trim() || !selectedRecipient || isSending}
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSending ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
};
