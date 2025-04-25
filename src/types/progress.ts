export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  created_at: string;
  name?: string;
}

export interface StudentAssignment {
  id: string;
  teacher_id: string;
  student_name: string;
  active: boolean;
  assigned_date: string;
}

export interface Communication {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageType = 'direct' | 'announcement' | 'feedback';
export type MessageCategory = 'administrative' | 'academic' | 'general';

export interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  recipient_id: string;
  recipient_name?: string;
  message: string;
  message_type?: MessageType;
  message_status?: string;
  category?: MessageCategory;
  read: boolean;
  created_at: string;
  parent_message_id?: string;
  attachment_url?: string;
}

export interface MessageRecipient {
  id: string;
  name: string;
  type: 'teacher' | 'admin';
}

export interface Progress {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  juz: number;
  pages: number;
  mistakes: number;
  duration: number;
  notes?: string;
  status: 'completed' | 'in-progress' | 'scheduled';
}

export interface DifficultAyah {
  id: string;
  student_id: string;
  surah: number;
  ayah: number;
  notes: string;
  date_added: string;
  status: 'active' | 'resolved';
}

export interface JuzRevision {
  id: string;
  student_id: string;
  juz_number: number;
  revision_date: string;
  proficiency_level: 'excellent' | 'good' | 'needs_improvement';
  notes?: string;
}

export interface RevisionsListProps {
  revisions: JuzRevision[];
  onEdit?: (revision: JuzRevision) => void;
  onDelete?: (id: string) => void;
}
