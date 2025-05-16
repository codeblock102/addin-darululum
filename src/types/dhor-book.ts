
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

// Updated JuzMastery type
export interface JuzMastery {
  id: string;
  student_id: string;
  juz_number: number;
  mastery_level: 'mastered' | 'memorized' | 'in_progress' | 'not_started';
  last_revision_date: string | null;
  revision_count: number;
  consecutive_good_revisions: number;
  students?: {
    name: string;
  };
}

export interface DhorEntry {
  id: string;
  student_id: string;
  teacher_id: string;
  entry_date: string;
  dhor_1?: string;
  dhor_1_mistakes?: number;
  dhor_2?: string;
  dhor_2_mistakes?: number;
  points: number;
  comments?: string;
  day_of_week: string;
  created_at: string;
  updated_at: string;
}
