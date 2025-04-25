export interface Schedule {
  id: string;
  class_name: string;
  days_of_week: string[];
  time_slots: {
    days: string[];
    start_time: string;
    end_time: string;
  }[];
}

export interface Progress {
  id: string;
  student_id: string | null;
  current_juz: number | null;
  completed_juz: number | null;
}

export interface DifficultAyah {
  id: string;
  student_id: string | null;
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  date_added: string | null;
  revision_count: number | null;
  last_revised: string | null;
  notes: string | null;
  status: string | null;
}

export interface JuzMastery {
  id: string;
  student_id: string | null;
  juz_number: number;
  mastery_level: 'not_started' | 'in_progress' | 'memorized' | 'mastered' | null;
  last_revision_date: string | null;
  revision_count: number | null;
  consecutive_good_revisions: number | null;
}

export interface JuzRevision {
  id: string;
  student_id: string | null;
  juz_revised: number;
  revision_date: string;
  memorization_quality: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible' | null;
  teacher_notes: string | null;
}

export interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  message: string;
  read: boolean | null;
  created_at: string | null;
}

export type MessageType = 'general' | 'progress' | 'assignment';
export type MessageCategory = 'student' | 'teacher' | 'admin';
export type MessageRecipient = {
  id: string;
  name: string;
  type: MessageCategory;
};

// Additional types as needed
export interface RevisionsListProps {
  studentId?: string;
}
