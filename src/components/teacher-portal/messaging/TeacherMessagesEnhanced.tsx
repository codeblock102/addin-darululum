
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { MessageList } from "./MessageList";
import { MessageCompose } from "./MessageCompose";
import { MessageRecipient } from "@/types/progress";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";

interface TeacherMessagesEnhancedProps {
  teacherId: string;
  teacherName: string;
}

export const TeacherMessagesEnhanced = ({ 
  teacherId, 
  teacherName 
}: TeacherMessagesEnhancedProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageTab, setMessageTab] = useState("inbox");
  const [inboxTab, setInboxTab] = useState("received");
  
  // Initialize real-time messages updates
  useRealtimeMessages(teacherId);
  
  const { data: inboxMessages, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ['teacher-inbox', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, read_at, category, updated_at,
          teachers!communications_sender_id_fkey(name)
        `)
        .eq('recipient_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((msg: any) => ({
        ...msg,
        sender_name: msg.teachers?.name || "Unknown Sender"
      }));
    }
  });
  
  const { data: sentMessages, isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: ['teacher-sent', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read, message_type, message_status, read_at, category, updated_at,
          teachers!communications_recipient_id_fkey(name)
        `)
        .eq('sender_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Include special admin messages sent with parent_message_id
      const { data: adminMessages, error: adminError } = await supabase
        .from('communications')
        .select('*')
        .eq('sender_id', teacherId)
        .not('parent_message_id', 'is', null)
        .order('created_at', { ascending: false });
        
      if (adminError) throw adminError;

      // Combine regular messages and admin messages
      const allMessages = [
        ...data.map((msg: any) => ({
          ...msg,
          recipient_name: msg.teachers?.name || "Unknown Recipient"
        })),
        ...(adminMessages || []).map((msg: any) => ({
          ...msg,
          recipient_name: "Administrator",
          recipient_id: msg.parent_message_id // Set the display recipient ID to the admin ID
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return allMessages;
    }
  });
  
  const { data: recipients, isLoading: recipientsLoading } = useQuery({
    queryKey: ['message-recipients', teacherId],
    queryFn: async () => {
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('id, name')
        .neq('id', teacherId);
      
      if (teachersError) throw teachersError;
      
      const formattedTeachers: MessageRecipient[] = teachers.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        type: "teacher" as const
      }));
      
      // Add admin recipient with special flag to handle differently
      const adminRecipients: MessageRecipient[] = [
        { 
          id: 'admin-1', 
          name: 'Administrator', 
          type: 'admin',
          isSpecial: true // Flag this as a special recipient that doesn't use UUID
        }
      ];
      
      return [...formattedTeachers, ...adminRecipients];
    }
  });
  
  const handleRefresh = () => {
    toast({
      title: "Refreshing messages",
      description: "Getting your latest messages..."
    });
    refetchInbox();
    refetchSent();
  };

  const unreadCount = inboxMessages?.filter(msg => !msg.read).length || 0;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with other teachers and administrators
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleRefresh} size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};
