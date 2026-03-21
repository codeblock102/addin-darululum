/**
 * @file src/components/admin/messaging/AdminMessageList.tsx
 * @summary Renders a list of admin messages with read/unread status.
 */

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Mail } from "lucide-react";
import { Message } from "@/types/progress.ts";

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
  onMessageClick,
  showRecipient = false,
}: AdminMessageListProps) => {
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
    null,
  );

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (isLoading) {
    return (
      <div className="animate-pulse flex flex-col space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
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
              !message.read
                ? "border-primary/40 bg-primary/5"
                : "border-border"
            }`}
            onClick={() => {
              setExpandedMessageId(
                expandedMessageId === message.id ? null : message.id,
              );
              if (onMessageClick) onMessageClick(message);
            }}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {showRecipient
                    ? (message.recipient_name?.charAt(0) || "T")
                    : (message.sender_name?.charAt(0) || "T")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {showRecipient
                      ? (message.recipient_name || "Unknown")
                      : (message.sender_name || "Teacher")}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {!message.read && (
                      <Badge
                        variant="default"
                        className="text-[10px] px-1 py-0"
                      >
                        New
                      </Badge>
                    )}
                    {message.category && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {message.category}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                </div>
                <p
                  className={`text-sm text-muted-foreground mt-1 ${
                    expandedMessageId === message.id ? "" : "truncate"
                  }`}
                >
                  {message.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
