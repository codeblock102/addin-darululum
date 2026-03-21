export interface StudentRecordSummary {
  id: string;
  name: string;
  sabaq: {
    done: boolean;
    date?: string;
    quality?: string;
  };
  sabaqPara: {
    done: boolean;
    date?: string;
    quality?: string;
  };
  dhor: {
    done: boolean;
    date?: string;
    quality?: string;
  };
  completionScore?: number;
}

export interface CompletionStats {
  sabaq: number;
  sabaqPara: number;
  dhor: number;
  total: number;
}

export type RecordTypeFilter = "all" | "incomplete" | "complete";
