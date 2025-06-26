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
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

interface MessageComposeProps {
  teacherId: string;
  recipients: MessageRecipient[];
  recipientsLoading: boolean;
}

export const MessageCompose = ({
  teacherId,
  recipients,
  recipientsLoading,
}: MessageComposeProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>(
    "academic",
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Messaging functionality is disabled
  };

  return (
    <form onSubmit={handleSendMessage} className="space-y-4">
      <Alert>
        <AlertDescription>
          Messaging functionality is currently disabled. Please contact the
          system administrator to enable this feature.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Recipient</Label>
        <Select
          value={selectedRecipient}
          onValueChange={setSelectedRecipient}
          disabled
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-recipients" disabled>
              Messaging disabled
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Message Type</Label>
          <Select
            value={messageType}
            onValueChange={(value) => setMessageType(value as MessageType)}
            disabled
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
            disabled
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
        <div className="relative">
          <textarea
            className="w-full min-h-[200px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Messaging is currently disabled..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled>
          <Send className="mr-2 h-4 w-4" />
          Send Message (Disabled)
        </Button>
      </div>
    </form>
  );
};
