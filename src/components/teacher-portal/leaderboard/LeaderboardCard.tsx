import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { useLeaderboardData } from '@/hooks/useLeaderboardData.ts';
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard.ts';
import { StudentRankItem } from './StudentRankItem.tsx';
import { ConfettiEffect } from './ConfettiEffect.tsx';
import { LeaderboardFilters } from '@/types/leaderboard.ts';
import { Trophy, Filter, RefreshCw, CheckSquare } from 'lucide-react';

interface LeaderboardCardProps {
  teacherId?: string;
  className?: string;
}

export const LeaderboardCard = ({ teacherId, className = '' }: LeaderboardCardProps) => {
  const [filters, setFilters] = useState<LeaderboardFilters>({
    timeRange: 'week',
    metricPriority: 'total',
    participationFilter: 'all',
    completionStatus: 'all'
  });
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [subjectTab, setSubjectTab] = useState('all');
  
  const { leaderboardData, isLoading, topStudent, refreshData } = useLeaderboardData(teacherId, filters);
  
  // Set up real-time updates
  useRealtimeLeaderboard(teacherId, refreshData);
  
  // Trigger confetti effect when visiting the component if there's a top student
  useEffect(() => {
    if (topStudent) {
      setTriggerConfetti(true);
      
      // Reset confetti after it runs
      const timer = setTimeout(() => {
        setTriggerConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [topStudent]);
  
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

  const handleParticipationFilterChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      participationFilter: value as LeaderboardFilters['participationFilter'] 
    }));
  };

  const handleCompletionStatusChange = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      completionStatus: value as LeaderboardFilters['completionStatus'] 
    }));
  };
  
  const handleRefresh = () => {
    refreshData();
  };
  
  // Filter students based on the selected subject tab
  const getFilteredStudents = () => {
    if (!leaderboardData?.length) return [];
    
    if (subjectTab === 'all') return leaderboardData;
    
    if (subjectTab === 'sabaq') {
      return leaderboardData.filter(student => student.sabaqs > 0);
    }
    
    if (subjectTab === 'sabaqPara') {
      return leaderboardData.filter(student => student.sabaqPara > 0);
    }
    
    return leaderboardData;
  };
  
  // Get checklist data for a student
  const getStudentCompletionStatus = (studentId: string) => {
    const student = leaderboardData.find(s => s.id === studentId);
    if (!student) return { sabaq: false, sabaqPara: false };
    
    return {
      sabaq: student.sabaqs > 0,
      sabaqPara: student.sabaqPara > 0,
    };
  };
  
  const filteredStudents = getFilteredStudents();

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
            <button
              type="button"
              onClick={handleRefresh} 
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              title="Show filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-lg animate-fade-in">
            <div className="flex flex-wrap gap-3 justify-between">
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
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-between">
              <Select defaultValue={filters.participationFilter} onValueChange={handleParticipationFilterChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Participation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue={filters.completionStatus} onValueChange={handleCompletionStatusChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Completion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Completed</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" onClick={() => setSubjectTab('all')}>All</TabsTrigger>
            <TabsTrigger value="sabaq" onClick={() => setSubjectTab('sabaq')}>Sabaq</TabsTrigger>
            <TabsTrigger value="sabaqPara" onClick={() => setSubjectTab('sabaqPara')}>Sabaq Para</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-3">
            <div className="mb-3 flex justify-between items-center">
              <h4 className="text-sm font-medium">All Subjects Overview</h4>
              <Badge variant="outline" className="h-5">
                {filteredStudents.length} students
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <StudentRankItem 
                    key={student.id} 
                    student={student}
                    isTopRank={student.rank === 1}
                    completionStatus={getStudentCompletionStatus(student.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-lg font-medium">No Students Found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters to see more results
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sabaq" className="mt-3">
            <div className="mb-3 flex justify-between items-center">
              <h4 className="text-sm font-medium">Sabaq Checklist</h4>
              <Badge variant="outline" className="h-5">
                {filteredStudents.length} students
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <StudentRankItem 
                    key={student.id} 
                    student={student}
                    isTopRank={student.rank === 1}
                    completionStatus={getStudentCompletionStatus(student.id)}
                    highlightSubject="sabaq"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-lg font-medium">No Sabaq Activity</p>
                <p className="text-sm text-muted-foreground">
                  No students have recorded sabaq in this period.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sabaqPara" className="mt-3">
            <div className="mb-3 flex justify-between items-center">
              <h4 className="text-sm font-medium">Sabaq Para Checklist</h4>
              <Badge variant="outline" className="h-5">
                {filteredStudents.length} students
              </Badge>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <StudentRankItem 
                    key={student.id} 
                    student={student}
                    isTopRank={student.rank === 1}
                    completionStatus={getStudentCompletionStatus(student.id)}
                    highlightSubject="sabaqPara"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-lg font-medium">No Sabaq Para Activity</p>
                <p className="text-sm text-muted-foreground">
                  No students have recorded sabaq para in this period.
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
