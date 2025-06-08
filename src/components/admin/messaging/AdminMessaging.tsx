import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { RefreshCcw } from "lucide-react";
import { AdminMessageList } from "./AdminMessageList.tsx";
import { AdminMessageCompose } from "./compose/AdminMessageCompose.tsx";
import { useRealtimeAdminMessages } from "@/hooks/useRealtimeAdminMessages.ts";
import { Message } from "@/types/progress.ts";
import type { Database } from "@/integrations/supabase/types.ts";

type RawMessage = Database['public']['Tables']['communications']['Row'] & {
  teachers: { name: string } | null;
};

export const AdminMessaging = () => {
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("inbox");

  // Initialize real-time messages updates
  useRealtimeAdminMessages();

  // Fetch all messages sent to admin (where recipient_id is 'admin-1')
  const {
    data: receivedMessages,
    isLoading: receivedLoading,
    refetch: refetchReceived
  } = useQuery({
    queryKey: ['admin-received-messages'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('communications').select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, 
          category, updated_at, parent_message_id,
          teachers!communications_sender_id_fkey(name)
        `).eq('recipient_id', 'admin-1').order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Format the received messages with sender names
      const formattedMessages = data.map((msg: RawMessage) => ({
        ...msg,
        sender_name: msg.teachers?.name || "Unknown Sender"
      })) as Message[];
      return formattedMessages;
    }
  });

  // Fetch all messages sent by admin (where sender_id is null and recipient_id references teachers)
  const {
    data: sentMessages,
    isLoading: sentLoading,
    refetch: refetchSent
  } = useQuery({
    queryKey: ['admin-sent-messages'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('communications').select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, 
          category, updated_at, parent_message_id,
          teachers!communications_recipient_id_fkey(name)
        `).is('sender_id', null).not('recipient_id', 'is', null).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Format the sent messages with recipient names
      const formattedMessages = data.map((msg: RawMessage) => ({
        ...msg,
        recipient_name: msg.teachers?.name || "Unknown Recipient"
      }));

      // Cast the formatted messages to the Message[] type
      const typedMessages = formattedMessages as unknown as Message[];
      return typedMessages;
    }
  });
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const {
        data,
        error
      } = await supabase.from('communications').update({
        read: true,
        updated_at: new Date().toISOString()
      }).eq('id', messageId).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['admin-received-messages']
      });
    }
  });
  const handleRefresh = () => {
    refetchReceived();
    refetchSent();
    toast({
      title: "Refreshing messages",
      description: "Getting your latest messages..."
    });
  };
  const handleMessageRead = (message: Message) => {
    if (!message.read) {
      markAsReadMutation.mutate(message.id);
    }
  };
  const unreadCount = receivedMessages?.filter(msg => !msg.read).length || 0;
  return <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 bg-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messaging</CardTitle>
              <CardDescription>
                Send and receive messages to and from teachers
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleRefresh} size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-gray-600">
          <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="inbox" className="relative">
                Inbox
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>}
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
                  <AdminMessageList messages={receivedMessages} isLoading={receivedLoading} emptyMessage="No messages received" onMessageClick={handleMessageRead} />
                </TabsContent>
                
                <TabsContent value="sent">
                  <AdminMessageList messages={sentMessages} isLoading={sentLoading} emptyMessage="No sent messages" showRecipient />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="compose">
              <AdminMessageCompose />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};