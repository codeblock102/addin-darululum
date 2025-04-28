
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminMessageList } from "./AdminMessageList";
import { AdminMessageReply } from "./AdminMessageReply";
import { AdminMessageCompose } from "./compose/AdminMessageCompose";
import { Message } from "@/types/progress";
import { useRealtimeAdminMessages } from "@/hooks/useRealtimeAdminMessages";

export const AdminMessaging = () => {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [activeTab, setActiveTab] = useState("received");
  
  // Initialize real-time updates for admin messages
  useRealtimeAdminMessages();
  
  const { data: receivedMessages, isLoading: receivedLoading, refetch: refetchReceived } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      // Get all messages sent to admin (where parent_message_id is not null and recipient_id is null)
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, category, updated_at, parent_message_id,
          teachers!communications_sender_id_fkey(name)
        `)
        .not('parent_message_id', 'is', null)
        .is('recipient_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((msg: any) => ({
        ...msg,
        sender_name: msg.teachers?.name || "Unknown Teacher"
      }));
    }
  });
  
  const { data: sentMessages, isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: ['admin-sent-messages'],
    queryFn: async () => {
      // Get all messages sent by admin (where sender_id is null)
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, category, updated_at, parent_message_id
        `)
        .is('sender_id', null)
        .not('parent_message_id', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // For each message, fetch the teacher's name using the parent_message_id which contains the teacher's ID
      const messagesWithTeacherNames = await Promise.all(
        data.map(async (msg) => {
          const { data: teacherData } = await supabase
            .from('teachers')
            .select('name')
            .eq('id', msg.parent_message_id)
            .single();
            
          return {
            ...msg,
            recipient_name: teacherData?.name || "Unknown Teacher",
            recipient_id: msg.parent_message_id // Use parent_message_id as the actual recipient ID
          };
        })
      );
      
      return messagesWithTeacherNames;
    }
  });
  
  const handleRefresh = () => {
    toast({
      title: "Refreshing messages",
      description: "Getting your latest messages..."
    });
    refetchReceived();
    refetchSent();
  };

  const handleReplyClick = (message: Message) => {
    setSelectedMessage(message);
  };

  const handleCloseReply = () => {
    setSelectedMessage(null);
  };

  const unreadCount = receivedMessages?.filter(msg => !msg.read).length || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Administrator Messages</CardTitle>
              <CardDescription>
                View and respond to communications from teachers
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleRefresh} size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="received" className="relative">
                    Received
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="compose">Compose</TabsTrigger>
                </TabsList>
                
                <TabsContent value="received">
                  <AdminMessageList 
                    messages={receivedMessages} 
                    isLoading={receivedLoading}
                    emptyMessage="No messages received from teachers"
                    onReplyClick={handleReplyClick}
                  />
                </TabsContent>
                
                <TabsContent value="sent">
                  <AdminMessageList 
                    messages={sentMessages} 
                    isLoading={sentLoading}
                    emptyMessage="No messages sent to teachers"
                  />
                </TabsContent>

                <TabsContent value="compose">
                  <AdminMessageCompose />
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              {selectedMessage && activeTab === "received" ? (
                <AdminMessageReply 
                  message={selectedMessage} 
                  onClose={handleCloseReply} 
                />
              ) : activeTab !== "compose" && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6 text-muted-foreground">
                    <p>Select a message to reply</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
