
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageComposer } from "./compose/MessageComposer";
import { MessagePreview } from "./compose/MessagePreview";
import { MessageStatus } from "./compose/MessageStatus";
import { TeacherSelector } from "./compose/TeacherSelector";
import { MessageOptions } from "./compose/MessageOptions";
import { MessageCategory, MessageType } from "@/types/progress";

export const AdminMessageCompose = () => {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>("general");
  const [previewMessage, setPreviewMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string>();

  const handleSendMessage = async (message: string) => {
    if (!selectedTeacher) {
      setError("Please select a teacher");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setPreviewMessage(message);

    try {
      // Simulate API call since communications table is removed
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus("success");
      
      // Reset form after successful send
      setTimeout(() => {
        setPreviewMessage("");
        setStatus("idle");
        setError(undefined);
      }, 3000);
    } catch (err) {
      setError("Failed to send message");
      setStatus("error");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">New Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <TeacherSelector
              selectedTeacher={selectedTeacher}
              onTeacherChange={setSelectedTeacher}
            />
            
            <MessageOptions
              messageType={messageType}
              messageCategory={messageCategory}
              onTypeChange={setMessageType}
              onCategoryChange={setMessageCategory}
            />
          </div>

          <div>
            <MessagePreview
              selectedTeacher={selectedTeacher}
              messageType={messageType}
              messageCategory={messageCategory}
              message={previewMessage}
            />
          </div>
        </div>

        <MessageStatus status={status} error={error} />

        <MessageComposer
          onSend={handleSendMessage}
          isLoading={status === "sending"}
        />
      </CardContent>
    </Card>
  );
};
