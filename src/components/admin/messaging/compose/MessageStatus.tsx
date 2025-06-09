
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MessageStatusProps {
  status: "idle" | "sending" | "success" | "error";
  error?: string;
}

export const MessageStatus = ({ status, error }: MessageStatusProps) => {
  if (status === "idle") return null;

  const statusConfig = {
    sending: {
      icon: Clock,
      variant: "default" as const,
      message: "Sending message...",
    },
    success: {
      icon: CheckCircle,
      variant: "default" as const,
      message: "Message sent successfully!",
    },
    error: {
      icon: AlertCircle,
      variant: "destructive" as const,
      message: error || "Failed to send message. Please try again.",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant}>
      <Icon className="h-4 w-4" />
      <AlertDescription>{config.message}</AlertDescription>
    </Alert>
  );
};
