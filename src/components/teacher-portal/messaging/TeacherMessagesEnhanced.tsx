import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { MessageTabs } from "./components/MessageTabs";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { useTeacherMessages } from "@/hooks/useTeacherMessages";

interface TeacherMessagesEnhancedProps {
  teacherId: string;
  teacherName: string;
}

export const TeacherMessagesEnhanced = ({
  teacherId,
  teacherName,
}: TeacherMessagesEnhancedProps) => {
  const { toast } = useToast();

  // Initialize real-time messages updates
  useRealtimeMessages(teacherId);

  // Use the custom hook to fetch all message data
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

  const handleRefresh = () => {
    toast({
      title: "Refreshing messages",
      description: "Getting your latest messages...",
    });
    refetchMessages();
  };

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
          <MessageTabs
            inboxMessages={inboxMessages}
            sentMessages={sentMessages}
            inboxLoading={inboxLoading}
            sentLoading={sentLoading}
            recipients={recipients}
            recipientsLoading={recipientsLoading}
            teacherId={teacherId}
            teacherName={teacherName}
            unreadCount={unreadCount}
          />
        </CardContent>
      </Card>
    </div>
  );
};
