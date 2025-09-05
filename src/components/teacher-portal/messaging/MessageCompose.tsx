import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Loader2, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  MessageCategory,
  MessageRecipient,
  MessageType,
} from "@/types/progress.ts";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface MessageComposeProps {
  teacherId: string;
  recipients: MessageRecipient[];
  recipientsLoading: boolean;
}

export const MessageCompose = ({
  teacherId,
  recipients,
  recipientsLoading,
}: MessageComposeProps) => {
  const { t } = useI18n();
  const [newMessage, setNewMessage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("direct");
  const [messageCategory, setMessageCategory] = useState<MessageCategory>(
    "academic",
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    // Messaging functionality is disabled
  };

  return (
    <form onSubmit={handleSendMessage} className="space-y-4">
      <Alert>
        <AlertDescription>
          {t("pages.teacherPortal.messages.disabled", "Messaging functionality is currently disabled. Please contact the system administrator to enable this feature.")}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>{t("pages.teacherPortal.messages.recipient", "Recipient")}</Label>
        <Select
          value={selectedRecipient}
          onValueChange={setSelectedRecipient}
          disabled
        >
          <SelectTrigger>
            <SelectValue placeholder={t("pages.teacherPortal.messages.selectRecipient", "Select recipient")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-recipients" disabled>
              {t("pages.teacherPortal.messages.disabledShort", "Messaging disabled")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("pages.teacherPortal.messages.type", "Message Type")}</Label>
          <Select
            value={messageType}
            onValueChange={(value) => setMessageType(value as MessageType)}
            disabled
          >
            <SelectTrigger>
              <SelectValue placeholder={t("pages.teacherPortal.messages.typePlaceholder", "Message type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="direct">{t("pages.teacherPortal.messages.typeDirect", "Direct")}</SelectItem>
              <SelectItem value="announcement">{t("pages.teacherPortal.messages.typeAnnouncement", "Announcement")}</SelectItem>
              <SelectItem value="feedback">{t("pages.teacherPortal.messages.typeFeedback", "Feedback")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("pages.teacherPortal.messages.category", "Category")}</Label>
          <Select
            value={messageCategory}
            onValueChange={(value) =>
              setMessageCategory(value as MessageCategory)}
            disabled
          >
            <SelectTrigger>
              <SelectValue placeholder={t("pages.teacherPortal.messages.categoryPlaceholder", "Message category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="administrative">{t("pages.teacherPortal.messages.catAdministrative", "Administrative")}</SelectItem>
              <SelectItem value="academic">{t("pages.teacherPortal.messages.catAcademic", "Academic")}</SelectItem>
              <SelectItem value="general">{t("pages.teacherPortal.messages.catGeneral", "General")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("pages.teacherPortal.messages.message", "Message")}</Label>
        <div className="relative">
          <textarea
            className="w-full min-h-[200px] p-3 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t("pages.teacherPortal.messages.textareaPlaceholder", "Messaging is currently disabled...")}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled>
          <Send className="mr-2 h-4 w-4" />
          {t("pages.teacherPortal.messages.sendDisabled", "Send Message (Disabled)")}
        </Button>
      </div>
    </form>
  );
};
