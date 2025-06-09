
import { Message } from "@/types/progress.ts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

interface AdminMessageReplyProps {
  message: Message | null;
  onClose: () => void;
}

export const AdminMessageReply = ({
  message,
  onClose,
}: AdminMessageReplyProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-md font-medium">
          Reply functionality unavailable
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-8 text-muted-foreground">
          <p>Reply functionality is currently unavailable.</p>
          <p className="text-sm mt-2">The communications table has been removed.</p>
        </div>
      </CardContent>
    </Card>
  );
};
