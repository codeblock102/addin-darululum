
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, RefreshCcw, User, Mail } from "lucide-react";

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  sender_name?: string;
  recipient_name?: string;
}

interface MessageRecipient {
  id: string;
  name: string;
  type: "student" | "teacher" | "parent";
}

interface TeacherMessagesProps {
  teacherId: string;
  teacherName: string;
}

export const TeacherMessages = ({ teacherId, teacherName }: TeacherMessagesProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageTab, setMessageTab] = useState("inbox");
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  
  // Fetch conversations (received messages)
  const { data: inboxMessages, isLoading: inboxLoading, refetch: refetchInbox } = useQuery({
    queryKey: ['teacher-inbox', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read,
          teachers!communications_sender_id_fkey(name)
        `)
        .eq('recipient_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format messages with sender names
      return data.map((msg: any) => ({
        ...msg,
        sender_name: msg.teachers?.name || "Unknown Sender"
      }));
    }
  });
  
  // Fetch sent messages
  const { data: sentMessages, isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: ['teacher-sent', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communications')
        .select(`
          id, message, created_at, sender_id, recipient_id, read,
          teachers!communications_recipient_id_fkey(name)
        `)
        .eq('sender_id', teacherId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format messages with recipient names
      return data.map((msg: any) => ({
        ...msg,
        recipient_name: msg.teachers?.name || "Unknown Recipient"
      }));
    }
  });
  
  // Fetch potential recipients (other teachers for now)
  const { data: recipients, isLoading: recipientsLoading } = useQuery({
    queryKey: ['message-recipients', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .neq('id', teacherId);
      
      if (error) throw error;
      
      return data.map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        type: "teacher" as const
      }));
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { recipient_id: string; message: string }) => {
      const { data, error } = await supabase
        .from('communications')
        .insert([
          {
            sender_id: teacherId,
            recipient_id: messageData.recipient_id,
            message: messageData.message,
            read: false
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-sent', teacherId] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      setNewMessage("");
      // Refetch sent messages to update the list
      refetchSent();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('communications')
        .update({ read: true })
        .eq('id', messageId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-inbox', teacherId] });
    }
  });
  
  // Handle sending a new message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecipient) {
      toast({
        title: "Error",
        description: "Please select a recipient.",
        variant: "destructive",
      });
      return;
    }
    
    if (!newMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate({
      recipient_id: selectedRecipient,
      message: newMessage
    });
  };
  
  // Handle marking a message as read when clicked
  const handleMessageClick = (message: Message) => {
    if (!message.read) {
      markAsReadMutation.mutate(message.id);
    }
  };
  
  // Refresh messages
  const handleRefresh = () => {
    refetchInbox();
    refetchSent();
  };
  
  // Format date for display
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with other teachers, students, and parents
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
              <TabsTrigger value="inbox">Inbox</TabsTrigger>
              <TabsTrigger value="compose">Compose</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inbox">
              <Tabs defaultValue="received">
                <TabsList className="mb-4">
                  <TabsTrigger value="received">Received</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                </TabsList>
                
                <TabsContent value="received">
                  {inboxLoading ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : inboxMessages && inboxMessages.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {inboxMessages.map((message: Message) => (
                          <div 
                            key={message.id}
                            className={`p-4 rounded-lg border ${message.read ? 'bg-background' : 'bg-muted/30 border-primary/20'}`}
                            onClick={() => handleMessageClick(message)}
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <p className="font-medium">From: {message.sender_name}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageDate(message.created_at)}
                                  </span>
                                </div>
                                <p className="mt-1">{message.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No messages in your inbox</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="sent">
                  {sentLoading ? (
                    <div className="flex justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : sentMessages && sentMessages.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {sentMessages.map((message: Message) => (
                          <div 
                            key={message.id}
                            className="p-4 rounded-lg border bg-background"
                          >
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <p className="font-medium">To: {message.recipient_name}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatMessageDate(message.created_at)}
                                  </span>
                                </div>
                                <p className="mt-1">{message.message}</p>
                                <div className="text-xs text-right mt-1">
                                  {message.read ? 
                                    <span className="text-green-600">Read</span> : 
                                    <span className="text-muted-foreground">Unread</span>
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No sent messages</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="compose">
              <form onSubmit={handleSendMessage} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipientsLoading ? (
                        <div className="flex justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : recipients && recipients.length > 0 ? (
                        recipients.map((recipient: MessageRecipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {recipient.name} ({recipient.type})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No recipients available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[200px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Type your message here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={sendMessageMutation.isPending || !selectedRecipient || !newMessage.trim()}
                  >
                    {sendMessageMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
