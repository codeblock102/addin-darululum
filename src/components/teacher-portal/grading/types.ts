
import { Student } from "@/types/teacher";

export interface GradingProps {
  teacherId: string;
}

export interface StudentGradeData {
  memorization_quality: string;
  tajweed_grade: string;
  attendance_grade: string;
  participation_grade: string;
  notes: string;
}

export interface StudentGrade {
  id: string;
  student_id: string;
  memorization_quality?: string;
  tajweed_level?: string;
  teacher_notes?: string;
  created_at: string;
  current_surah?: number;
  current_juz?: number;
  date?: string;
  contributor_name?: string;
}
