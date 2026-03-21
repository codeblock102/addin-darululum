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
} from "lucide-react";
import { Message, MessageType } from "@/types/progress.ts";

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
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null,
  );

  const handleMessageClick = (message: Message) => {
    setExpandedMessageId(
      expandedMessageId === message.id ? null : message.id,
    );
    if (onMessageClick) onMessageClick(message);
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
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
              !message.read ? "border-primary/40 bg-primary/5" : "border-border"
            }`}
            onClick={() => handleMessageClick(message)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {showRecipient
                    ? (message.recipient_name?.charAt(0) || "?")
                    : (message.sender_name?.charAt(0) || "A")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {showRecipient
                      ? (message.recipient_name || "Unknown")
                      : (message.sender_name || "Admin")}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {getMessageTypeIcon(message.message_type)}
                    {!message.read && (
                      <Badge variant="default" className="text-[10px] px-1 py-0">
                        New
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                </div>
                <p
                  className={`text-sm text-muted-foreground mt-1 ${
                    expandedMessageId === message.id
                      ? ""
                      : "truncate"
                  }`}
                >
                  {message.message}
                </p>
              </div>
            </div>
            {expandedMessageId === message.id && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-sm">{message.message}</p>
                {message.category && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {message.category}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
