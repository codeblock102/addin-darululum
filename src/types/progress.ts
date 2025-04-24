export interface JuzRevision {
  id: string;
  student_id: string;
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
  created_at?: string;
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

export interface JuzMastery {
  id: string;
  student_id?: string;
  juz_number: number;
  mastery_level?: 'not_started' | 'in_progress' | 'memorized' | 'mastered';
  last_revision_date?: string;
  revision_count?: number;
  consecutive_good_revisions?: number;
  created_at: string;
}

export interface Progress {
  id: string;
  student_id?: string;
  current_surah?: number;
  start_ayat?: number;
  end_ayat?: number;
  verses_memorized?: number;
  date?: string;
  current_juz?: number;
  completed_juz?: number;
  memorization_quality?: QualityRating;
  last_revision_date?: string;
  notes?: string;
  last_completed_surah?: string;
  tajweed_level?: string;
  revision_status?: string;
  teacher_notes?: string;
  created_at: string;
}

export interface NewRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export type Revision = JuzRevision;

export interface RevisionsListProps {
  revisions: JuzRevision[];
  studentId: string;
  studentName: string;
  onAddRevision: () => void;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  read: boolean;
  updated_at?: string;
  message_type?: MessageType;
  message_status?: MessageStatus;
  read_at?: string;
  category?: MessageCategory;
  sender_name?: string;
  recipient_name?: string;
}

export type MessageType = 'general' | 'urgent' | 'feedback';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessageCategory = 'administrative' | 'academic' | 'personal';

export interface MessageRecipient {
  id: string;
  name: string;
  type: "student" | "teacher" | "admin";
}

export interface Schedule {
  id: string;
  teacher_id: string | null;
  capacity: number;
  current_students: number;
  time_slot: string;
  class_name: string;
  room: string;
  day_of_week: string;
  template_id?: string | null;
  recurrence_pattern?: string | null;
  schedule_type?: string | null;
  last_modified?: string | null;
  created_at?: string | null;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  default_capacity: number;
  default_duration: number;
  applicable_terms?: string[];
}

export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string;
  title: string;
  description: string;
  assigned_date: string;
  due_date: string;
  status: AssignmentStatus;
  submission_date?: string;
  feedback?: string;
  grade?: string;
  performance_metrics?: Record<string, any>;
}

export type AssignmentStatus = 'assigned' | 'submitted' | 'reviewed' | 'returned' | 'completed';
