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

export interface JuzMastery {
  id: string;
  student_id: string;
  juz_number: number;
  mastery_level: 'mastered' | 'memorized' | 'in_progress' | 'not_started' | 'learning' | 'reviewing' | null;
  last_revision_date: string | null;
  revision_count: number;
  consecutive_good_revisions: number;
  students?: {
    name: string;
  };
}

export interface DailyActivityEntry {
  id: string;
  student_id: string;
  teacher_id: string;
  entry_date: string;
  current_juz?: number;
  current_surah?: number;
  start_ayat?: number;
  end_ayat?: number;
  sabaq_para_data?: {
    juz_number: number;
    quarters_revised?: string;
    quality_rating?: string;
  };
  juz_revisions_data?: {
    id: string;
    dhor_slot: number;
    juz_number?: number;
    juz_revised?: number;
    quarter_start?: number;
    quarters_covered?: number;
    memorization_quality?: string;
  }[];
  memorization_quality?: string;
  comments?: string;
  day_of_week?: string;
  points?: number;
}

export interface JuzRevisionEntry {
  id: string;
  student_id?: string; // Assuming it might be part of the direct table schema
  teacher_id?: string; // Assuming it might be part of the direct table schema
  dhor_slot?: number;    // From DailyActivityEntry context
  juz_number?: number;
  juz_revised?: number; // This was in DailyActivityEntry, might be juz_number from table
  revision_date?: string; // Assuming it might be part of the direct table schema
  quarter_start?: number;
  quarters_covered?: number;
  memorization_quality?: string;
  notes?: string; // Common to have notes
  // Include other fields that come directly from the 'juz_revisions' table
  students?: { name: string }; // As seen in RecentRevisions.tsx query
}

export interface DifficultAyahEntry {
  id: string;
  student_id: string;
  surah_number: number;
  ayah_number: number;
  notes?: string;
  date_added: string;
  status: 'active' | 'resolved';
  last_revised: string | null;
  revision_count: number;
}

export interface RevisionFormValues {
  date: Date;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  time_spent: number; // in minutes
  notes?: string;
  juz_number: number;
  surah_number?: number;
  quarters_revised: "1st_quarter" | "2_quarters" | "3_quarters" | "4_quarters";
  teacher_notes?: string;
  status: "completed" | "pending" | "needs_improvement";
}
