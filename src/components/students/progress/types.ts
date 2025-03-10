
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
