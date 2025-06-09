
import { MessageCategory, MessageType } from "@/types/progress.ts";

interface AdminMessageFormProps {
  selectedTeacher: string;
  messageType: MessageType;
  messageCategory: MessageCategory;
}

export const AdminMessageForm = ({
  selectedTeacher,
  messageType,
  messageCategory,
}: AdminMessageFormProps) => {
  return (
    <div className="text-center p-8 text-muted-foreground">
      <p>Message form is currently unavailable.</p>
      <p className="text-sm mt-2">The communications table has been removed.</p>
    </div>
  );
};
