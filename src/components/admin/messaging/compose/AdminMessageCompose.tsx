
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { MessageCategory, MessageType } from "@/types/progress.ts";
import { AdminMessageForm } from "./AdminMessageForm.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

export const AdminMessageCompose = () => {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>(
    "administrative",
  );

  const handleSendSuccess = () => {
    setSelectedTeachers([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">New Message</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Messaging functionality is currently disabled. Please contact the system administrator to enable this feature.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <AdminMessageForm
            selectedTeachers={selectedTeachers}
            messageType={messageType}
            category={messageCategory}
            onSendSuccess={handleSendSuccess}
          />
        </div>
      </CardContent>
    </Card>
  );
};
