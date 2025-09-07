import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  AlertCircle,
  ClipboardCheck,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { Message, MessageType } from "@/types/progress.ts";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

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
  const { t } = useI18n();
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null,
  );

  const handleMessageClick = (message: Message) => {
    // Messaging functionality is disabled
    if (onMessageClick) {
      onMessageClick(message);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getMessageTypeIcon = (type: MessageType | undefined) => {
    switch (type) {
      case "announcement":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "feedback":
        return <ClipboardCheck className="h-4 w-4 text-green-500" />;
      case "direct":
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-pulse flex flex-col w-full space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <Alert className="mb-4">
        <AlertDescription>
          {t("pages.teacherPortal.messages.disabled", "Messaging functionality is currently disabled. Please contact the system administrator to enable this feature.")}
        </AlertDescription>
      </Alert>
      <div className="text-center p-6 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>{emptyMessage}</p>
      </div>
    </ScrollArea>
  );
};
