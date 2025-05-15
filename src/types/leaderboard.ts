
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

export interface LeaderboardFilters {
  timeRange: 'today' | 'week' | 'month' | 'all';
  metricPriority: 'total' | 'sabaq' | 'sabaqPara' | 'dhor';
}

export type LeaderboardSortOrder = 'asc' | 'desc';
