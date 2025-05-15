
export interface StudentLeaderboardData {
  id: string;
  name: string;
  sabaqs: number;
  sabaqPara: number;
  dhor: number;
  totalPoints: number;
  lastActivity: string;
  rank?: number;
}

export interface StudentCompletionStatus {
  sabaq: boolean;
  sabaqPara: boolean;
  dhor: boolean;
}

export interface LeaderboardFilters {
  timeRange: 'today' | 'week' | 'month' | 'all';
  metricPriority: 'total' | 'sabaq' | 'sabaqPara' | 'dhor';
  participationFilter?: 'all' | 'active' | 'inactive';
  completionStatus?: 'all' | 'complete' | 'incomplete';
}

export type LeaderboardSortOrder = 'asc' | 'desc';
