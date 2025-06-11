import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

interface AdminMessageListProps {
  messages: any[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onReplyClick?: (message: any) => void;
  onMessageClick?: (message: any) => void;
  showRecipient?: boolean;
}

export const AdminMessageList = ({
  emptyMessage,
}: AdminMessageListProps) => {
  return (
    <ScrollArea className="h-[400px]">
      <div className="text-center p-6 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <Alert>
          <AlertDescription>
            Messaging functionality is currently disabled. Please contact the
            system administrator to enable this feature.
          </AlertDescription>
        </Alert>
      </div>
    </ScrollArea>
  );
};
