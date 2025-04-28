
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  AlertCircle, 
  MessageSquare, 
  ClipboardCheck 
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message, MessageType } from "@/types/progress";

interface MessageListProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onMessageClick?: (message: Message) => void;
  showRecipient?: boolean;
}

// Create an extended message type that includes the properties used in the component
interface ExtendedMessage extends Message {
  read_at?: string;
  updated_at?: string;
}

export const MessageList = ({
  messages,
  isLoading,
  emptyMessage,
  onMessageClick,
  showRecipient = false
}: MessageListProps) => {
  const queryClient = useQueryClient();
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('communications')
        .update({ 
          read: true,
          updated_at: now
        })
        .eq('id', messageId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-sent'] });
    }
  });

  const handleMessageClick = (message: ExtendedMessage) => {
    setExpandedMessageId(expandedMessageId === message.id ? null : message.id);
    
    if (onMessageClick) {
      onMessageClick(message);
    }

    if (!message.read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getMessageTypeIcon = (type: MessageType | undefined) => {
    switch (type) {
      case 'announcement':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'feedback':
        return <ClipboardCheck className="h-4 w-4 text-green-500" />;
      case 'direct':
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
      <div className="space-y-4">
        {messages?.map((message) => {
          const extendedMessage = message as ExtendedMessage;
          return (
            <div 
              key={message.id}
              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                message.read ? 'bg-background' : 'bg-muted/30 border-primary/20'
              } ${expandedMessageId === message.id ? 'shadow-md' : ''}`}
              onClick={() => handleMessageClick(extendedMessage)}
            >
              <div className="flex items-start space-x-3">
                <Avatar>
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {showRecipient 
                          ? `To: ${message.recipient_name}` 
                          : `From: ${message.sender_name}`}
                      </p>
                      {message.message_type && (
                        <div className="flex items-center">
                          {getMessageTypeIcon(message.message_type)}
                        </div>
                      )}
                      {message.category && (
                        <Badge variant="outline" className="text-xs">
                          {message.category}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                  
                  <div className={`mt-2 ${expandedMessageId === message.id ? '' : 'line-clamp-2'}`}>
                    <p>{message.message}</p>
                  </div>
                  
                  {expandedMessageId === message.id && (
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {extendedMessage.updated_at && message.read && 
                          `Read: ${formatMessageDate(extendedMessage.updated_at)}`}
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        setExpandedMessageId(null);
                      }}>
                        Collapse
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
