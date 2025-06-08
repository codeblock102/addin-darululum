import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Avatar, AvatarFallback } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { User, Mail, MessageSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { Message } from "@/types/progress.ts";

interface AdminMessageListProps {
  messages: Message[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onReplyClick?: (message: Message) => void;
  onMessageClick?: (message: Message) => void; // Added missing prop
  showRecipient?: boolean; // Added missing prop
}

export const AdminMessageList = ({
  messages,
  isLoading,
  emptyMessage,
  onReplyClick,
  onMessageClick, // Added to props destructuring
  showRecipient = false // Added with default value
}: AdminMessageListProps) => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    }
  });

  const handleMessageClick = (message: Message) => {
    setExpandedMessageId(expandedMessageId === message.id ? null : message.id);
    
    if (!message.read) {
      markAsReadMutation.mutate(message.id);
    }
    
    // Call the passed onMessageClick handler if provided
    if (onMessageClick) {
      onMessageClick(message);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
        {messages?.map((message) => (
          <div 
            key={message.id}
            className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
              message.read ? 'bg-background' : 'bg-muted/30 border-primary/20'
            } ${expandedMessageId === message.id ? 'shadow-md' : ''}`}
            onClick={() => handleMessageClick(message)}
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
                        ? `To: ${message.recipient_name || "Unknown Recipient"}`
                        : `From: ${message.sender_name || "Unknown Teacher"}`
                      }
                    </p>
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                    </div>
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
                      {message.updated_at && message.read && 
                        `Read: ${formatMessageDate(message.updated_at)}`}
                    </div>
                    <div className="space-x-2">
                      {onReplyClick && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplyClick(message);
                          }}
                        >
                          Reply
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedMessageId(null);
                        }}
                      >
                        Collapse
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
