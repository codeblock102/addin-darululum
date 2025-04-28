
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "../MessageList";
import { MessageCompose } from "../MessageCompose";
import { Message, MessageRecipient } from "@/types/progress";

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
  teacherName,
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
              showRecipient={true}
            />
          </TabsContent>
        </Tabs>
      </TabsContent>
      
      <TabsContent value="compose">
        <MessageCompose 
          teacherId={teacherId}
          teacherName={teacherName}
          recipients={recipients || []}
          recipientsLoading={recipientsLoading}
        />
      </TabsContent>
    </Tabs>
  );
};
