export interface Progress {
  id: string;
  student_id: string;
  current_surah?: number;
  end_surah?: number;
  start_ayat?: number;
  end_ayat?: number;
  verses_memorized?: number;
  entry_date?: string;
  current_juz?: number;
  completed_juz?: number[]; // Changed from number to number[] to match database schema
  memorization_quality?:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  last_revision_date?: string;
  created_at: string;
  notes?: string;
  last_completed_surah?: string;
  tajweed_level?: string;
  revision_status?: string;
  teacher_notes?: string;
  // These fields are needed in other files
  teacher_id?: string;
  juz?: number;
  pages?: number;
  mistakes?: number;
  students?: { name: string };
}

export interface JuzRevision {
  id: string;
  student_id: string;
  juz_revised: number;
  revision_date: string;
  memorization_quality:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  created_at: string;
  teacher_notes?: string;
}

export interface RevisionsListProps {
  revisions?: JuzRevision[];
  studentId: string;
  studentName?: string;
  onAddRevision?: () => void;
}

export interface DifficultAyah {
  id: string;
  student_id: string;
  surah_number: number;
  ayah_number: number;
  juz_number: number;
  date_added: string;
  notes: string;
  revision_count: number;
  last_revised: string | null;
  status: "active" | "resolved";
  created_at?: string;
}

// Define messaging-related interfaces
export interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  sender_name?: string;
  recipient_name?: string;
  message_type?: MessageType;
  message_status?: string;
  read_at?: string;
  category?: MessageCategory;
  updated_at?: string;
  parent_message_id?: string; // Added this field to fix TypeScript error
}

export interface ProgressFormData {
  start_ayat: number;
  end_ayat: number;
  verses_memorized?: number;
  current_surah?: number;
  end_surah?: number;
  current_juz?: number;
  memorization_quality?:
    | "excellent"
    | "good"
    | "average"
    | "needsWork"
    | "horrible";
  notes?: string;
}

export type MessageType = "direct" | "announcement" | "feedback";
export type MessageCategory = "academic" | "administrative" | "general";

export interface MessageRecipient {
  id: string;
  name: string;
  type: "student" | "teacher" | "parent" | "admin";
  isSpecial?: boolean; // Flag to indicate if this is a special recipient (not using UUID)
}
