import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { RefreshCcw } from "lucide-react";
import { AdminMessageList } from "./AdminMessageList.tsx";
import { AdminMessageCompose } from "./compose/AdminMessageCompose.tsx";
import { useAdminMessages } from "@/hooks/useAdminMessages.ts";

export const AdminMessaging = () => {
  const [activeTab, setActiveTab] = useState("inbox");
  const {
    receivedMessages,
    sentMessages,
    receivedLoading,
    sentLoading,
    refetchMessages,
  } = useAdminMessages();

  const unreadCount = receivedMessages.filter((m) => !m.read).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                Messaging
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Send and receive messages to and from teachers
              </CardDescription>
            </div>
            <Button variant="outline" onClick={refetchMessages} size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="inbox"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="inbox">
                Inbox
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="compose">Compose</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox">
              <Tabs defaultValue="received">
                <TabsList>
                  <TabsTrigger value="received">Received</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>

                <TabsContent value="received">
                  <AdminMessageList
                    messages={receivedMessages}
                    isLoading={receivedLoading}
                    emptyMessage="No messages received"
                  />
                </TabsContent>

                <TabsContent value="sent">
                  <AdminMessageList
                    messages={sentMessages}
                    isLoading={sentLoading}
                    emptyMessage="No sent messages"
                    showRecipient
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="compose">
              <AdminMessageCompose />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
