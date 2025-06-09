
import { MessageCategory, MessageRecipient, MessageType } from "@/types/progress.ts";

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
  return (
    <div className="text-center p-8 text-muted-foreground">
      <p>Message composition is currently unavailable.</p>
      <p className="text-sm mt-2">The communications table has been removed.</p>
    </div>
  );
};
