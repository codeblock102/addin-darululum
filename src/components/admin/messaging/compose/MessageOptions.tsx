import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { MessageCategory, MessageType } from "@/types/progress.ts";

interface MessageOptionsProps {
  messageType: MessageType;
  setMessageType: (value: MessageType) => void;
  messageCategory: MessageCategory;
  setMessageCategory: (value: MessageCategory) => void;
}

export const MessageOptions = ({ 
  messageType, 
  setMessageType,
  messageCategory,
  setMessageCategory
}: MessageOptionsProps) => {
  return (
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
  );
};
