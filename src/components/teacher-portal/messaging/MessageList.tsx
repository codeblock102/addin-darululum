
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Mail } from "lucide-react";
import { Message } from "@/types/progress.ts";

interface MessageListProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onMessageClick?: (message: Message) => void;
  showRecipient?: boolean;
}

export const MessageList = ({
  messages,
  isLoading,
  emptyMessage,
  onMessageClick,
  showRecipient = false,
}: MessageListProps) => {
  return (
    <ScrollArea className="h-[400px]">
      <div className="text-center p-6 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>Messages are currently unavailable.</p>
        <p className="text-sm mt-2">The communications table has been removed.</p>
      </div>
    </ScrollArea>
  );
};
