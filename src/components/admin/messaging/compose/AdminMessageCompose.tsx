
import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { MessageCategory, MessageType } from "@/types/progress";
import { TeacherSelector } from "./TeacherSelector";
import { MessageOptions } from "./MessageOptions";
import { AdminMessageForm } from "./AdminMessageForm";

export const AdminMessageCompose = () => {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>("administrative");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">New Message</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <TeacherSelector 
            selectedTeacher={selectedTeacher} 
            setSelectedTeacher={setSelectedTeacher}
          />
          
          <MessageOptions 
            messageType={messageType}
            setMessageType={setMessageType}
            messageCategory={messageCategory}
            setMessageCategory={setMessageCategory}
          />
          
          <AdminMessageForm
            selectedTeacher={selectedTeacher}
            messageType={messageType}
            messageCategory={messageCategory}
          />
        </div>
      </CardContent>
    </Card>
  );
};
