
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export const AdminRecentActivity = () => {
  return (
    <Card className="admin-card">
      <CardHeader className="pb-3 md:pb-4">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Activity className="h-4 w-4 md:h-5 md:w-5" />
          Recent System Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
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
