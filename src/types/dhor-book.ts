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
  progress?: {
    current_juz?: number | null;
    current_surah?: number | null;
    start_ayat?: number | null;
    end_ayat?: number | null;
  } | null;
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
  last_updated_by: string | null;
  last_entry_date: string;
  signature: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevisionSchedule {
  id: string;
  student_id: string;
  juz_number: number;
  surah_number?: number;
  scheduled_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled' | 'postponed';
  created_at: string;
  notes?: string;
}

export interface StudentPerformanceMetrics {
  totalEntries: number;
  averagePoints: number;
  attendanceRate: number;
  lastEntry: string | null;
  totalMistakes: number;
  progressTrend: 'improving' | 'steady' | 'declining' | 'unknown';
  completedJuz: number;
  currentJuz: number;
}
