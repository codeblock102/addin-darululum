
export interface ProgressFormData {
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  notes: string;
}

export interface ProgressEntry extends ProgressFormData {
  id: string;
  student_id: string;
  date: string;
  last_revision_date?: string;
  contributor_id?: string;
  contributor_name?: string;
}

export interface NewProgressEntryProps {
  studentId: string;
  studentName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Dhor Book (Revision System) Types
export interface RevisionEntry {
  id: string;
  student_id: string;
  juz_number: number;
  surah_number?: number;
  revision_date: string;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  revision_count: number;
  quarters_revised: '1st_quarter' | '2_quarters' | '3_quarters' | '4_quarters';
  teacher_notes?: string;
  teacher_id?: string;
  teacher_name?: string;
  status: 'completed' | 'pending' | 'needs_improvement';
}

export interface DhorBookProps {
  studentId: string;
  studentName: string;
}

export interface RevisionFormData {
  juz_number: number;
  surah_number?: number;
  quarters_revised: '1st_quarter' | '2_quarters' | '3_quarters' | '4_quarters';
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  teacher_notes: string;
  status: 'completed' | 'pending' | 'needs_improvement';
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
  last_revised: string;
  status: 'active' | 'resolved';
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
