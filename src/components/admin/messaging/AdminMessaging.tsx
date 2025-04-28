
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { AdminMessageList } from "./AdminMessageList";
import { AdminMessageReply } from "./AdminMessageReply";
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
      // Get all messages that have parent_message_id set (these are admin messages)
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, read_at, category, updated_at, parent_message_id,
          teachers!communications_sender_id_fkey(name)
        `)
        .eq('parent_message_id', 'admin-1') // Messages specifically sent to admin
        .is('recipient_id', null) // Directly to admin, not a response
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((msg: any) => ({
        ...msg,
        sender_name: msg.teachers?.name || "Unknown Teacher"
      }));
    }
  });
  
  const { data: sentMessages, isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: ['admin-responses'],
    queryFn: async () => {
      // Get all admin responses (messages sent by admin)
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, read_at, category, updated_at, parent_message_id,
          teachers!communications_recipient_id_fkey(name)
        `)
        .is('sender_id', null) // Messages sent by admin (null sender_id)
        .not('parent_message_id', 'is', null) // Has a parent message
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((msg: any) => ({
        ...msg,
        recipient_name: msg.teachers?.name || "Unknown Teacher"
      }));
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
                    emptyMessage="No replies sent to teachers"
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              {selectedMessage ? (
                <AdminMessageReply 
                  message={selectedMessage} 
                  onClose={handleCloseReply} 
                />
              ) : (
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
