/**
 * @file src/components/admin/messaging/compose/AdminMessageForm.tsx
 * @summary Form for composing and sending admin messages to teachers.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Loader2, Send } from "lucide-react";
import { MessageCategory, MessageType } from "@/types/progress.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useQueryClient } from "@tanstack/react-query";

interface AdminMessageFormProps {
  selectedTeachers: string[];
  messageType: MessageType;
  category: MessageCategory;
  onSendSuccess: () => void;
}

export const AdminMessageForm = ({
  selectedTeachers,
  messageType,
  category,
  onSendSuccess,
}: AdminMessageFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || selectedTeachers.length === 0) return;

    setIsSending(true);
    try {
      const inserts = selectedTeachers.map((teacherId) => ({
        sender_id: null, // null sender_id = admin message by convention
        recipient_id: teacherId,
        message: message.trim(),
        message_type: messageType,
        category,
        read: false,
      }));

      const { error } = await supabase.from("communications").insert(inserts);
      if (error) throw error;

      toast({ title: `Message sent to ${selectedTeachers.length} teacher(s)` });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-sent"] });
      onSendSuccess();
    } catch (err) {
      console.error("Failed to send admin message:", err);
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows={6}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={!message.trim() || selectedTeachers.length === 0 || isSending}
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
