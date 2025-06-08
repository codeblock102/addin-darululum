export interface StudentLeaderboardData {
  id: string;
  name: string;
  sabaqs: number;
  sabaqPara: number;
  totalPoints: number;
  lastActivity: string;
  rank?: number;
}

export interface StudentCompletionStatus {
  sabaq: boolean;
  sabaqPara: boolean;
}

export interface LeaderboardFilters {
  timeRange: "today" | "week" | "month" | "all";
  metricPriority: "total" | "sabaq" | "sabaqPara";
  participationFilter?: "all" | "active" | "inactive";
  completionStatus?: "all" | "complete" | "incomplete";
}

export type LeaderboardSortOrder = "asc" | "desc";
