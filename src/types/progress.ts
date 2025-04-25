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

export interface Progress {
  id: string;
  student_id: string;
  current_surah: number;
  current_juz: number;
  verses_memorized: number;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible';
  date: string;
  notes?: string;
}

export interface Schedule {
  id: string;
  teacher_id: string;
  class_name: string;
  time_slot: string;
  day_of_week: string;
  room: string;
  capacity: number;
  current_students: number;
}

export interface JuzMastery {
  id: string;
  student_id: string;
  juz_number: number;
  mastery_level: 'not_started' | 'learning' | 'reviewing' | 'mastered';
  last_revision_date: string | null;
  revision_count: number;
  consecutive_good_revisions: number;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  read: boolean;
}

export type MessageType = 'direct' | 'announcement' | 'feedback';
export type MessageCategory = 'general' | 'academic' | 'administrative';
export type MessageRecipient = 'student' | 'teacher' | 'admin';

export interface RevisionSchedule {
  id: string;
  student_id: string;
  juz_number: number;
  scheduled_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'missed';
}
