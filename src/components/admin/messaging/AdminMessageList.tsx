
import { Message } from "@/types/progress.ts";
import { Mail } from "lucide-react";

interface AdminMessageListProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onReplyClick?: (message: Message) => void;
  onMessageClick?: (message: Message) => void;
  showRecipient?: boolean;
}

export const AdminMessageList = ({
  messages,
  isLoading,
  emptyMessage,
  onReplyClick,
  onMessageClick,
  showRecipient = false,
}: AdminMessageListProps) => {
  return (
    <div className="text-center p-6 text-muted-foreground">
      <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
      <p>Messages are currently unavailable.</p>
      <p className="text-sm mt-2">The communications table has been removed.</p>
    </div>
  );
};
