
export interface JuzRevision {
  id: string;
  student_id?: string;
  juz_revised: number;
  revision_date: string;
  memorization_quality: QualityRating;
  teacher_notes?: string;
}

export interface DifficultAyah {
  id: string;
  student_id?: string;
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  date_added?: string;
  last_revised?: string;
  revision_count?: number;
  notes?: string;
  status: 'active' | 'resolved' | 'pending';
}

export type QualityRating = 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';

export interface RevisionData {
  student_id: string;
  juz_revised: number;
  revision_date: string;
  memorization_quality: QualityRating;
  teacher_notes?: string;
}

export interface EditDifficultAyahDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  difficultAyah: DifficultAyah | null;
  studentId: string;
  onSuccess: () => void;
}

export type Revision = JuzRevision;
