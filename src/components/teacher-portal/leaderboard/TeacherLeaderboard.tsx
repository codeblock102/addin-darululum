
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaderboardCard } from './LeaderboardCard';

interface TeacherLeaderboardProps {
  teacherId: string;
}

export const TeacherLeaderboard = ({ teacherId }: TeacherLeaderboardProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold tracking-tight">Student Leaderboard</h2>
        <p className="text-muted-foreground">
          Track student performance in Sabaq, Sabaq Para, and Dhor activities.
        </p>
      </div>
      
      <div className="grid gap-6">
        <LeaderboardCard teacherId={teacherId} />
        
        <Card>
          <CardHeader>
            <CardTitle>Understanding the Leaderboard</CardTitle>
            <CardDescription>How students are ranked on the leaderboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Metrics Tracked</h4>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li><span className="font-medium">Sabaq:</span> Number of juz revisions completed</li>
                <li><span className="font-medium">Sabaq Para:</span> Number of sabaq para entries</li>
                <li><span className="font-medium">Dhor:</span> Number of dhor entries recorded</li>
                <li><span className="font-medium">Points:</span> Total points earned from all activities</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Ranking Factors</h4>
              <p className="text-sm text-muted-foreground">
                Students are ranked based on your selected metric. By default, the ranking uses total points
                earned, followed by total number of activities. You can change the ranking metric using the
                selector above the leaderboard.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                The leaderboard updates automatically whenever new entries are added to the system.
                Students will move up or down the rankings based on their performance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
