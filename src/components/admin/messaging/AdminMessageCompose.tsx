
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { MessageCategory, MessageType } from "@/types/progress.ts";
import { Button } from "@/components/ui/button.tsx";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

export const AdminMessageCompose = () => {
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
      </CardContent>
    </Card>
  );
};
