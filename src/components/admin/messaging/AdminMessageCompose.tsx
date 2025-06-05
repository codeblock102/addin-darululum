import React from 'react';
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import { MessageCategory, MessageType } from "@/types/progress.ts";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card.tsx";

export const AdminMessageCompose = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>("administrative");

  // Fetch teachers to populate recipient dropdown
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['admin-message-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name', { ascending: true });
        
      if (error) throw error;
      return data.map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        type: "teacher" as const
      }));
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      recipient_id: string;
      message: string;
      message_type: MessageType;
      category: MessageCategory;
    }) => {
      // Create message from admin to teacher
      const { data, error } = await supabase
        .from('communications')
        .insert([
          {
            sender_id: null, // Admin doesn't have a UUID in the teachers table
            recipient_id: messageData.recipient_id, // Store teacher ID directly in recipient_id
            message: messageData.message,
            read: false,
            message_type: messageData.message_type,
            category: messageData.category,
            message_status: 'sent'
            // No longer using parent_message_id field
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sent-messages'] });
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
      setNewMessage("");
      setSelectedTeacher("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeacher) {
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
      recipient_id: selectedTeacher,
      message: newMessage,
      message_type: messageType,
      category: messageCategory
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">New Message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachersLoading ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : teachers && teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} (Teacher)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-teachers" disabled>No teachers available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Message Type</Label>
              <Select value={messageType} onValueChange={(value) => setMessageType(value as MessageType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="feedback">Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={messageCategory} onValueChange={(value) => setMessageCategory(value as MessageCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Message category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Message</Label>
            <div className="relative">
              <textarea
                className="w-full min-h-[150px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSendMessage}
          disabled={sendMessageMutation.isPending || !selectedTeacher || !newMessage.trim()}
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
      </CardFooter>
    </Card>
  );
};
