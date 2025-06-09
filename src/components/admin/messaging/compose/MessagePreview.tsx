
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCategory, MessageType } from "@/types/progress";

interface MessagePreviewProps {
  selectedTeacher: string;
  messageType: MessageType;
  messageCategory: MessageCategory;
  message: string;
}

export const MessagePreview = ({
  selectedTeacher,
  messageType,
  messageCategory,
  message,
}: MessagePreviewProps) => {
  if (!message.trim()) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          Message Preview
          <Badge variant="outline" className="text-xs">
            {messageType}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {messageCategory}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground">
          To: {selectedTeacher || "No teacher selected"}
        </div>
        <div className="text-sm bg-muted p-3 rounded-md">
          {message}
        </div>
      </CardContent>
    </Card>
  );
};
