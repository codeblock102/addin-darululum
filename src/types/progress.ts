
// Add or update interfaces to match what's expected by the components

export interface JuzRevision {
  id: string;
  student_id?: string;
  juz_revised: number;
  revision_date: string;
  teacher_notes?: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  teacher_id?: string;
  quarters_revised?: '1st_quarter' | '2_quarters' | '3_quarters' | '4_quarters';
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

export interface Progress {
  id: string;
  student_id: string;
  current_surah?: number;
  current_juz?: number;
  verses_memorized?: number;
  completed_juz?: number;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  created_at?: string;
  start_ayat?: number;
  end_ayat?: number;
  last_revision_date?: string;
  students?: {
    name: string;
  };
}

export interface Revision extends JuzRevision {
  student_id: string;
  // Any additional fields specific to Revision interface
}
