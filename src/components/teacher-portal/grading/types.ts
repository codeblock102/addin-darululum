export interface GradingProps {
  teacherId: string;
}

export interface Student {
  name: string;
  id: string;
  status?: string;
  current_surah?: number;
  current_juz?: number;
  last_grade?: string;
  memorization_quality?: string;
}

export interface ProgressData {
  current_surah?: number;
  current_juz?: number;
  memorization_quality?: string;
}

export interface GradeData {
  memorization_quality:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  notes: string;
}

export interface StudentGrade {
  created_at: string;
  memorization_quality: string | null;
  current_surah: number | null;
  current_juz: number | null;
  notes?: string;
}
