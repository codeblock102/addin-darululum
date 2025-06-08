import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useRealtimeLeaderboard } from "@/hooks/useRealtimeLeaderboard";
import { CheckCircle, Circle, ExternalLink, Trophy } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardWidgetProps {
  teacherId: string;
}

export const LeaderboardWidget = ({ teacherId }: LeaderboardWidgetProps) => {
  const navigate = useNavigate();
  const { leaderboardData, isLoading, refreshData } = useLeaderboardData(
    teacherId,
    {
      timeRange: "week",
      metricPriority: "total",
    },
  );

  // Set up real-time updates
  useRealtimeLeaderboard(teacherId, refreshData);

  const topStudents = leaderboardData?.slice(0, 3) || [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewLeaderboard = () => {
    navigate("/teacher-portal?tab=leaderboard");
  };

  const getCompletionIcon = (completed: boolean) => {
    return completed
      ? <CheckCircle className="h-3 w-3 text-green-500" />
      : <Circle className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg font-medium">
          <Trophy className="h-5 w-5 text-amber-500 mr-2" />
          Student Leaders
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-1">
        {isLoading
          ? (
            <div className="flex justify-center p-4">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent">
              </div>
            </div>
          )
          : topStudents.length > 0
          ? (
            <div className="space-y-3">
              {topStudents.map((student, index) => (
                <div key={student.id} className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center">
                    {index === 0
                      ? <Trophy className="h-5 w-5 text-yellow-500" />
                      : index === 1
                      ? <span className="font-medium text-gray-400">2</span>
                      : <span className="font-medium text-amber-700">3</span>}
                  </div>

                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary-foreground text-primary text-xs">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="ml-2 flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">
                      {student.name}
                    </p>
                    <div className="flex space-x-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getCompletionIcon(student.sabaqs > 0)}
                        <span>S</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getCompletionIcon(student.sabaqPara > 0)}
                        <span>SP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getCompletionIcon(student.dhor > 0)}
                        <span>D</span>
                      </div>
                      <span className="ml-1">•</span>
                      <span>{student.totalPoints} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
          : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No student activity recorded this week
              </p>
            </div>
          )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          onClick={handleViewLeaderboard}
        >
          View Full Leaderboard
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
