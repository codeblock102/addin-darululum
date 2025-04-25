export interface Schedule {
  id: string;
  name: string;
  class_name?: string;   // For backward compatibility
  days_of_week: string[];
  time_slots: {
    days: string[];
    start_time: string;
    end_time: string;
  }[];
  room?: string;
  capacity?: number;
  current_students?: number;
  
  // Deprecated fields - kept for backward compatibility
  day_of_week?: string;  
  time_slot?: string;    
}

export interface Progress {
  id: string;
  student_id: string | null;
  current_juz: number | null;
  completed_juz: number | null;
  // Additional fields referenced in components
  date?: string | null;
  current_surah?: number | null;
  verses_memorized?: number | null;
  memorization_quality?: 'excellent' | 'good' | 'average' | 'needsWork' | 'horrible' | null;
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
  // Additional fields referenced in components
  recipient_name?: string;
  sender_name?: string;
  message_type?: MessageType;
  category?: MessageCategory;
}

export type MessageType = 'general' | 'progress' | 'assignment' | 'announcement' | 'feedback' | 'direct';
export type MessageCategory = 'student' | 'teacher' | 'admin' | 'academic';
export type MessageRecipient = {
  id: string;
  name: string;
  type: MessageCategory;
};

export interface RevisionsListProps {
  studentId?: string;
  revisions?: JuzRevision[];
  studentName?: string;
  onAddRevision?: () => void;
}
