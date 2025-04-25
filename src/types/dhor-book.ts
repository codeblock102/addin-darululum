
export interface DhorBookEntry {
  id: string;
  student_id: string;
  teacher_id: string;
  entry_date: string;
  day_of_week: string;
  sabak: string | null;
  sabak_para: string | null;
  dhor_1: string | null;
  dhor_1_mistakes: number;
  dhor_2: string | null;
  dhor_2_mistakes: number;
  comments: string | null;
  points: number;
  detention: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentComment {
  id: string;
  student_id: string;
  comment: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface StudentDhorSummary {
  id: string;
  student_id: string;
  days_absent: number;
  total_points: number;
  last_updated_by: string;
  last_entry_date: string;
  signature: string | null;
  created_at: string;
  updated_at: string;
}
