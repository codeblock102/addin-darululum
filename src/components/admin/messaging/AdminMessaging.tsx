
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { RefreshCcw } from "lucide-react";

export const AdminMessaging = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("inbox");

  const handleRefresh = () => {
    toast({
      title: "Refreshing messages",
      description: "Getting your latest messages...",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 bg-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messaging</CardTitle>
              <CardDescription>
                Send and receive messages to and from teachers
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleRefresh} size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="bg-gray-600">
          <div className="text-center p-8 text-muted-foreground">
            <p>Messaging functionality is currently unavailable.</p>
            <p className="text-sm mt-2">The communications table has been removed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
