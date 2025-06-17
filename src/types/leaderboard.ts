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
}

export interface LeaderboardFilters {
  timeRange: "today" | "week" | "month" | "all";
  metricPriority: "total" | "sabaqs" | "sabaqPara";
  participationFilter?: "all" | "active" | "inactive";
  completionStatus?: "all" | "complete" | "incomplete";
}

export interface LeaderboardOptions {
  timeRange: "today" | "week" | "month" | "all";
  metricPriority: "sabaqs" | "sabaqPara" | "total";
}

export type LeaderboardSortOrder = "asc" | "desc";
