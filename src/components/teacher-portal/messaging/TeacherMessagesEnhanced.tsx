import { useToast } from "@/components/ui/use-toast.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TeacherMessagesEnhancedProps {
  teacherId: string;
  teacherName: string;
}

export const TeacherMessagesEnhanced = ({
  teacherId,
  teacherName,
}: TeacherMessagesEnhancedProps) => {
  const { toast } = useToast();

  const handleRefresh = () => {
    toast({
      title: "Feature Disabled",
      description: "Messaging functionality is currently disabled.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with other teachers and administrators
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              size="sm"
              disabled
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Messaging functionality is currently disabled. Please contact the
              system administrator to enable this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
