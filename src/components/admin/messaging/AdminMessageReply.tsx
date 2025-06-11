
import React from "react";
import { Button } from "@/components/ui/button.tsx";
import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

interface AdminMessageReplyProps {
  message: any | null;
  onClose: () => void;
}

export const AdminMessageReply = ({
  onClose,
}: AdminMessageReplyProps) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Reply to Message
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        <Alert>
          <AlertDescription>
            Messaging functionality is currently disabled. Please contact the system administrator to enable this feature.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
