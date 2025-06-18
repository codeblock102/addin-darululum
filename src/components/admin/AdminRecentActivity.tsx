
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export const AdminRecentActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent System Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            No recent system activity to display
          </div>
          <div className="text-xs text-muted-foreground">
            Activity logs will appear here as users interact with the system
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
