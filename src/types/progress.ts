
// Add or update interfaces to match what's expected by the components

export interface JuzRevision {
  id: string;
  student_id?: string;
  juz_revised: number;
  revision_date: string;
  teacher_notes?: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  teacher_id?: string;
  teachers?: {
    name: string;
  };
}

export interface JuzMastery {
  id: string;
  student_id?: string;
  juz_number: number;
  mastery_level?: 'not_started' | 'in_progress' | 'memorized' | 'mastered';
  last_revision_date?: string;
  revision_count?: number;
  consecutive_good_revisions?: number;
}

export interface DifficultAyah {
  id: string;
  student_id?: string;
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  date_added?: string;
  revision_count: number;
  last_revised?: string;
  status: string;
  notes?: string;
}

export interface RevisionScheduleItem {
  id: string;
  student_id?: string;
  juz_number: number;
  surah_number?: number;
  scheduled_date: string;
  priority?: string;
  status: string;
  isOverdue?: boolean;
}
