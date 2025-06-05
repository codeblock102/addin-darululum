export interface StudentProgressReportData {
  student_id: string;
  student_name: string;
  guardian_email: string | null;
  report_date: string; // YYYY-MM-DD

  // Sabaq from 'progress' table
  sabaq_current_juz: number | null;
  sabaq_current_surah: number | null;
  sabaq_start_ayat: number | null;
  sabaq_end_ayat: number | null;
  sabaq_memorization_quality: string | null;
  sabaq_comments: string | null;

  // Sabaq Para from 'sabaq_para' table
  sabaq_para_juz: number | null;
  sabaq_para_number: number | null;
  sabaq_para_pages_revised: number | null;
  sabaq_para_teacher_notes: string | null;

  // Dhor from 'juz_revisions' table
  dhor_juz_revisions: Array<{
    juz_number: number;
    dhor_type: string | null; // e.g., 'MANZIL', 'SABAQI'
    lines_memorized: number | null;
    teacher_comments: string | null;
    revision_quality: string | null;
    dhor_slot: number | null;
  }> | null;

  // Attendance from 'attendance' table
  attendance_status: string | null; // 'present', 'absent', 'late', 'excused', 'not-marked'
  attendance_notes: string | null;
}

export interface JuzRevisionEntry {
  id: string;
  student_id: string;
  teacher_id?: string;
  revision_date: string;
  juz_number: number;
  dhor_type?: string;
  lines_memorized?: number;
  teacher_comments?: string;
  revision_quality?: string;
  created_at?: string;
  dhor_slot?: number; // Added based on DhorBook.tsx usage
}

export interface SabaqParaEntry {
  id: string;
  student_id: string;
  teacher_id?: string;
  revision_date: string;
  juz?: number;
  para_number?: number;
  pages_revised?: number;
  teacher_notes?: string;
  created_at?: string;
}

export interface ProgressEntry {
  id: string;
  student_id: string;
  teacher_id?: string;
  date: string;
  current_juz?: number;
  current_surah?: number;
  start_ayat?: number;
  end_ayat?: number;
  memorization_quality?: string;
  comments?: string;
  created_at?: string;
}

export interface AttendanceEntry {
  id: string;
  student_id: string;
  date: string;
  status: string;
  notes?: string;
  class_id?: string;
  teacher_id?: string;
  created_at?: string;
} 