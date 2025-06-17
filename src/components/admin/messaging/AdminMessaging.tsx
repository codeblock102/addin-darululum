import { useState } from "react";
import { useToast } from "@/components/ui/use-toast.ts";
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
import { RefreshCcw } from "lucide-react";
import { AdminMessageList } from "./AdminMessageList.tsx";
import { AdminMessageCompose } from "./compose/AdminMessageCompose.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

export const AdminMessaging = () => {
  const [activeTab, setActiveTab] = useState("inbox");

  const handleRefresh = () => {
    // Disabled for now
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 bg-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messaging</CardTitle>
              <CardDescription>
                Send and receive messages to and from teachers
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              size="sm"
              disabled
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-gray-600">
          <Alert className="mb-4">
            <AlertDescription>
              Messaging functionality is currently disabled. Please contact the
              system administrator to enable this feature.
            </AlertDescription>
          </Alert>

          <Tabs
            defaultValue="inbox"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="inbox" disabled>
                Inbox
              </TabsTrigger>
              <TabsTrigger value="compose" disabled>Compose</TabsTrigger>
            </TabsList>

            <TabsContent value="inbox">
              <Tabs defaultValue="received">
                <TabsList>
                  <TabsTrigger value="received" disabled>Received</TabsTrigger>
                  <TabsTrigger value="sent" disabled>Sent</TabsTrigger>
                </TabsList>

                <TabsContent value="received">
                  <AdminMessageList
                    messages={[]}
                    isLoading={false}
                    emptyMessage="No messages received"
                  />
                </TabsContent>

                <TabsContent value="sent">
                  <AdminMessageList
                    messages={[]}
                    isLoading={false}
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
