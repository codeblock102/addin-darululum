import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeaderboardCard } from "./LeaderboardCard";
import { CheckSquare } from "lucide-react";

interface TeacherLeaderboardProps {
  teacherId: string;
}

export const TeacherLeaderboard = ({ teacherId }: TeacherLeaderboardProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold tracking-tight">
          Student Leaderboard
        </h2>
        <p className="text-muted-foreground">
          Track student performance in Sabaq, Sabaq Para, and Dhor activities.
        </p>
      </div>

      <div className="grid gap-6">
        <LeaderboardCard teacherId={teacherId} />

        <Card>
          <CardHeader>
            <CardTitle>Understanding the Leaderboard</CardTitle>
            <CardDescription>
              How students are ranked and tracked on the leaderboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Subject Tabs</h4>
              <p className="text-sm text-muted-foreground">
                The leaderboard is organized into subject-specific tabs (Sabaq,
                Sabaq Para, and Dhor). Each tab provides a checklist format
                showing completion status for each student in that subject.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Checklist Indicators</h4>
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completed activity</span>
              </div>
              <p className="text-sm text-muted-foreground">
                For each subject, students are marked with a checkmark if
                they've completed at least one activity in that area. This
                provides a quick visual reference of student participation
                across subjects.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Filtering Options</h4>
              <p className="text-sm text-muted-foreground">
                Use the filter icon to access additional filtering options:
                <ul className="list-disc pl-5 mt-1">
                  <li>Time range (today, week, month, all time)</li>
                  <li>
                    Metrics for ranking (total points, or by specific subject)
                  </li>
                  <li>Participation filters (active vs inactive students)</li>
                  <li>
                    Completion status (complete vs incomplete subject
                    requirements)
                  </li>
                </ul>
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                The leaderboard updates automatically whenever new entries are
                added to any of the tracking systems. New achievements are
                immediately reflected in the rankings and completion status,
                with toast notifications to alert you of changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
