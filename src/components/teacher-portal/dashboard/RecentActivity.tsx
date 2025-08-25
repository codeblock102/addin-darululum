import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";

interface RecentActivityProps {
  teacherId?: string;
  isAdmin?: boolean;
}

export const RecentActivity = ({ teacherId, isAdmin = false }: RecentActivityProps) => {
  return (
    <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all duration-200">
      <CardHeader className={`pb-3 ${isAdmin ? 'pb-2' : 'pb-3'}`}>
        <CardTitle className={`flex items-center gap-3 font-semibold text-gray-800 ${isAdmin ? 'text-base' : 'text-lg'}`}>
          <div className={`p-2 bg-green-100 rounded-lg ${isAdmin ? 'p-1.5' : 'p-2'}`}>
            <TrendingUp className={`text-green-600 ${isAdmin ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-gray-100 rounded-full">
              <Activity className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          <div className="text-sm text-black mb-1">
            No recent activity to display
          </div>
          <div className="text-xs text-black">
            Activity will appear here as it happens
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
