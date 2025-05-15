
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLeaderboardData } from '@/hooks/useLeaderboardData';
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard';
import { StudentRankItem } from './StudentRankItem';
import { ConfettiEffect } from './ConfettiEffect';
import { LeaderboardFilters } from '@/types/leaderboard';
import { Award, Trophy } from 'lucide-react';

interface LeaderboardCardProps {
  teacherId?: string;
  className?: string;
}

export const LeaderboardCard = ({ teacherId, className = '' }: LeaderboardCardProps) => {
  const [filters, setFilters] = useState<LeaderboardFilters>({
    timeRange: 'week',
    metricPriority: 'total'
  });
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  
  const { leaderboardData, isLoading, topStudent } = useLeaderboardData(teacherId, filters);
  
  // Set up real-time updates
  useRealtimeLeaderboard(teacherId);
  
  // Trigger confetti effect when visiting the component if there's a top student
  useState(() => {
    if (topStudent) {
      setTriggerConfetti(true);
    }
  });
  
  const handleTimeRangeChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      timeRange: value as LeaderboardFilters['timeRange'] 
    }));
  };
  
  const handleMetricChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      metricPriority: value as LeaderboardFilters['metricPriority'] 
    }));
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Student Leaderboard
            </CardTitle>
            <CardDescription>Track your students' progress and achievement</CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue={filters.timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue={filters.metricPriority} onValueChange={handleMetricChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total Points</SelectItem>
                <SelectItem value="sabaq">Sabaq</SelectItem>
                <SelectItem value="sabaqPara">Sabaq Para</SelectItem>
                <SelectItem value="dhor">Dhor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Students</TabsTrigger>
            <TabsTrigger value="top">Top 3</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-3 mt-3">
            {isLoading ? (
              <div className="flex justify-center p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : leaderboardData.length > 0 ? (
              leaderboardData.map((student) => (
                <StudentRankItem 
                  key={student.id} 
                  student={student}
                  isTopRank={student.rank === 1} 
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Award className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-lg font-medium">No Leaderboard Data</p>
                <p className="text-sm text-muted-foreground">
                  Start recording student progress to see them on the leaderboard
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="top" className="space-y-3 mt-3">
            {isLoading ? (
              <div className="flex justify-center p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : leaderboardData.length > 0 ? (
              leaderboardData.slice(0, 3).map((student) => (
                <StudentRankItem 
                  key={student.id} 
                  student={student}
                  isTopRank={student.rank === 1}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Award className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-lg font-medium">No Top Students Yet</p>
                <p className="text-sm text-muted-foreground">
                  Start recording student progress to see top performers
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Confetti effect when there's a top student */}
      <ConfettiEffect active={triggerConfetti && !!topStudent} />
    </Card>
  );
};
