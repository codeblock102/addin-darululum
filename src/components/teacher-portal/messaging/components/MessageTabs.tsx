import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { MessageList } from "../MessageList.tsx";
import { MessageCompose } from "../MessageCompose.tsx";
import { Message, MessageRecipient } from "@/types/progress.ts";

interface MessageTabsProps {
  inboxMessages: Message[] | undefined;
  sentMessages: Message[] | undefined;
  inboxLoading: boolean;
  sentLoading: boolean;
  recipients: MessageRecipient[] | undefined;
  recipientsLoading: boolean;
  teacherId: string;
  teacherName: string;
  unreadCount: number;
}

export const MessageTabs = ({
  inboxMessages,
  sentMessages,
  inboxLoading,
  sentLoading,
  recipients,
  recipientsLoading,
  teacherId,
  unreadCount
}: MessageTabsProps) => {
  const [messageTab, setMessageTab] = useState("inbox");
  const [inboxTab, setInboxTab] = useState("received");

  return (
    <Tabs value={messageTab} onValueChange={setMessageTab}>
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="inbox" className="relative">
          Inbox
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="compose">Compose</TabsTrigger>
      </TabsList>
      
      <TabsContent value="inbox">
        <Tabs value={inboxTab} onValueChange={setInboxTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          
          <TabsContent value="received">
            <MessageList 
              messages={inboxMessages} 
              isLoading={inboxLoading}
              emptyMessage="No messages in your inbox"
            />
          </TabsContent>
          
          <TabsContent value="sent">
            <MessageList 
              messages={sentMessages} 
              isLoading={sentLoading}
              emptyMessage="No sent messages"
              showRecipient
            />
          </TabsContent>
        </Tabs>
      </TabsContent>
      
      <TabsContent value="compose">
        <MessageCompose 
          teacherId={teacherId}
          recipients={recipients || []}
          recipientsLoading={recipientsLoading}
        />
      </TabsContent>
    </Tabs>
  );
};
