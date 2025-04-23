
export interface Progress {
  id: string;
  student_id: string;
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  completed_juz: number;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  last_revision_date: string;
  last_completed_surah: string;
  tajweed_level: string;
  revision_status: string;
  teacher_notes: string;
  notes: string;
  date: string;
  created_at: string;
  contributor_id?: string;
  contributor_name?: string;
  students?: {
    name: string;
  };
  teacher_id?: string;
  is_new_lesson?: boolean;
  lesson_type?: 'hifz' | 'nazirah' | 'qaida';
  quality_rating?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  page_start?: number;
  page_end?: number;
  mistake_count?: number;
  auto_rating?: string;
}

export interface JuzMastery {
  id: string;
  student_id: string;
  juz_number: number;
  mastery_level: 'not_started' | 'in_progress' | 'memorized' | 'mastered';
  last_revision_date: string | null;
  revision_count: number;
  consecutive_good_revisions: number;
}

export interface JuzRevision {
  id: string;
  student_id: string;
  juz_revised: number;
  revision_date: string;
  teacher_notes?: string;
  created_at: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  quarters_revised?: '1st_quarter' | '2_quarters' | '3_quarters' | '4_quarters';
  teacher_id?: string;
  teachers?: {
    name: string;
  };
}

export interface DifficultAyah {
  id: string;
  student_id: string;
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  date_added: string;
  notes: string;
  revision_count: number;
  last_revised: string | null;
  status: 'active' | 'resolved';
  created_at?: string;
}

export interface RevisionScheduleItem {
  id: string;
  student_id: string;
  juz_number: number;
  surah_number?: number;
  scheduled_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue';
  created_at: string;
}

export interface StudentAssignment {
  id: string;
  student_id: string;
  assignment_date: string;
  surah_number: number;
  start_ayat: number;
  end_ayat: number;
  page_start?: number;
  page_end?: number;
  assignment_type: 'sabaq' | 'sabaq_para' | 'dhor' | 'nazirah' | 'qaida';
  status: 'pending' | 'completed' | 'missed';
  teacher_id?: string;
  created_at?: string;
}

export interface StudentStatus {
  student_id: string;
  student_name: string;
  learning_type: 'hifz' | 'nazirah' | 'qaida';
  pending_assignments: number;
  missed_assignments: number;
  pending_details?: string;
}
