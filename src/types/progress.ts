
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
  students?: {
    name: string;
  };
}
