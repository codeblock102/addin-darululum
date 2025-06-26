export interface ProgressFormData {
  current_surah: number;
  current_juz: number;
  start_ayat: number;
  end_ayat: number;
  verses_memorized: number;
  memorization_quality:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  notes: string;
  page_start?: number;
  page_end?: number;
  mistake_count?: number;
  is_new_lesson?: boolean;
  lesson_type?: "hifz" | "nazirah" | "qaida";
  quality_rating?: "excellent" | "good" | "average" | "needsWork" | "horrible";
  auto_rating?: string;
}

export interface ProgressEntry extends ProgressFormData {
  id: string;
  student_id: string;
  date: string;
  last_revision_date?: string;
  contributor_id?: string;
  contributor_name?: string;
  auto_rating?: string;
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
  memorization_quality:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  revision_count: number;
  quarters_revised: "1st_quarter" | "2_quarters" | "3_quarters" | "4_quarters";
  teacher_notes?: string;
  teacher_id?: string;
  teacher_name?: string;
  status: "completed" | "pending" | "needs_improvement";
}

export interface DhorBookProps {
  studentId: string;
  studentName: string;
}

export interface RevisionFormData {
  juz_number: number;
  surah_number?: number;
  quarters_revised: "1st_quarter" | "2_quarters" | "3_quarters" | "4_quarters";
  memorization_quality:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  teacher_notes?: string;
  status: "completed" | "pending" | "needs_improvement";
}

// Student Assignment Types
export interface StudentAssignment {
  id: string;
  student_id: string;
  assignment_date: string;
  surah_number: number;
  start_ayat: number;
  end_ayat: number;
  page_start?: number;
  page_end?: number;
  assignment_type: "sabaq" | "sabaq_para" | "dhor" | "nazirah" | "qaida";
  status: "pending" | "completed" | "missed";
  teacher_id?: string;
  created_at?: string;
}

export interface StudentStatusSummary {
  student_id: string;
  student_name: string;
  learning_type: "hifz" | "nazirah" | "qaida";
  pending_assignments: number;
  missed_assignments: number;
  pending_details?: string;
}

// DifficultAyah Type (needed for EditDifficultAyahDialog)
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
  status: "active" | "resolved";
  created_at?: string;
}
