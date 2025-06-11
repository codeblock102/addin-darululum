
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { MessageCategory, MessageType } from "@/types/progress.ts";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

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
  onSendSuccess 
}: AdminMessageFormProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Messaging functionality is disabled
    onSendSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <AlertDescription>
          Messaging functionality is currently disabled. Please contact the system administrator to enable this feature.
        </AlertDescription>
      </Alert>
      
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          rows={6}
          disabled
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          type="submit" 
          disabled={!message.trim() || selectedTeachers.length === 0 || isSending}
        >
          {isSending ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
};
