import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeacherMessages } from "@/hooks/useTeacherMessages.ts";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages.ts";
import { MessageList } from "./MessageList.tsx";
import { MessageCompose } from "./MessageCompose.tsx";

interface TeacherMessagesEnhancedProps {
  teacherId: string;
  teacherName: string;
}

export const TeacherMessagesEnhanced = ({
  teacherId,
  teacherName: _teacherName,
}: TeacherMessagesEnhancedProps) => {
  const {
    inboxMessages,
    sentMessages,
    recipients,
    inboxLoading,
    sentLoading,
    recipientsLoading,
    refetchMessages,
    unreadCount,
  } = useTeacherMessages(teacherId);

  useRealtimeMessages(teacherId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                Messages
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Communicate with other teachers and administrators
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={refetchMessages}
              size="sm"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inbox">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="inbox">
                Inbox
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="compose">Compose</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox">
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

            <TabsContent value="compose">
              <MessageCompose
                teacherId={teacherId}
                recipients={recipients}
                recipientsLoading={recipientsLoading}
                onSendSuccess={refetchMessages}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
