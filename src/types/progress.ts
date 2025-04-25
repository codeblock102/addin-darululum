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
  status: 'active' | 'resolved' | 'pending';
}

export interface TeacherInfo {
  name: string;
}

export interface JuzRevision {
  id: string;
  student_id: string;
  juz_revised: number;
  revision_date: string;
  teacher_notes?: string;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  teacher?: TeacherInfo;
}

export interface RevisionsListProps {
  revisions: JuzRevision[];
  studentId: string;
  studentName: string;
  onAddRevision: () => void;
}
