
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageComposerProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export const MessageComposer = ({ onSend, isLoading = false }: MessageComposerProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Type your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        className="min-h-[100px] resize-none"
        disabled={isLoading}
      />
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Press Ctrl + Enter to send
        </p>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </div>
  );
};
