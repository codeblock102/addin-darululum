import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types.ts";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string;

/**
 * Custom Database type that extends the generated Database type
 * with additional types.
 */
interface CustomDatabase extends Database {
  public: {
    Tables: Database["public"]["Tables"] & {
      classes: {
        Row: Database["public"]["Tables"]["classes"]["Row"] & {
          teacher_ids?: string[] | null;
          current_students?: string[] | null;
        };
        Insert: Database["public"]["Tables"]["classes"]["Insert"] & {
          teacher_ids?: string[] | null;
          current_students?: string[] | null;
        };
        Update: Database["public"]["Tables"]["classes"]["Update"] & {
          teacher_ids?: string[] | null;
          current_students?: string[] | null;
        };
        Relationships: Database["public"]["Tables"]["classes"]["Relationships"];
      };
      communications: {
        Row: {
          id: string;
          message: string;
          subject: string | null;
          created_at: string;
          sender_id: string;
          recipient_id: string;
          read: boolean | null;
          message_type?: string | null;
          category?: string | null;
        };
        Insert: {
          id?: string;
          message: string;
          subject?: string | null;
          created_at?: string;
          sender_id: string;
          recipient_id: string;
          read?: boolean | null;
          message_type?: string | null;
          category?: string | null;
        };
        Update: {
          id?: string;
          message?: string;
          subject?: string | null;
          created_at?: string;
          sender_id?: string;
          recipient_id?: string;
          read?: boolean | null;
          message_type?: string | null;
          category?: string | null;
        };
        Relationships: [];
      };
      teachers: {
        Row: {
          id: string;
          email: string | null;
          name?: string | null;
          subject?: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          subject?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          subject?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      difficult_ayahs: {
        Row: {
          id: string;
          student_id: string;
          surah_number: number;
          ayah_number: number;
          juz_number: number;
          date_added: string;
          notes: string;
          revision_count: number;
          last_revised: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string;
          surah_number?: number;
          ayah_number?: number;
          juz_number?: number;
          date_added?: string;
          notes?: string;
          revision_count?: number;
          last_revised?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          surah_number?: number;
          ayah_number?: number;
          juz_number?: number;
          date_added?: string;
          notes?: string;
          revision_count?: number;
          last_revised?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "difficult_ayahs_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_schedule: {
        Row: {
          id: string;
          student_id: string;
          juz_number: number;
          scheduled_date: string;
          status: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string;
          juz_number?: number;
          scheduled_date?: string;
          status?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          juz_number?: number;
          scheduled_date?: string;
          status?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_schedule_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_assignments: {
        Row: {
          id: string;
          student_id: string;
          assignment_type: string;
          assignment_date: string;
          start_surah: number;
          start_ayah: number;
          end_surah: number;
          end_ayah: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string;
          assignment_type?: string;
          assignment_date?: string;
          start_surah?: number;
          start_ayah?: number;
          end_surah?: number;
          end_ayah?: number;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          assignment_type?: string;
          assignment_date?: string;
          start_surah?: number;
          start_ayah?: number;
          end_surah?: number;
          end_ayah?: number;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_assignments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_assignments: {
        Row: {
          id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          status: "pending" | "completed" | "overdue";
          attachment_name: string | null;
          attachment_url: string | null;
          class_ids: string[];
          student_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: "pending" | "completed" | "overdue";
          attachment_name?: string | null;
          attachment_url?: string | null;
          class_ids?: string[];
          student_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: "pending" | "completed" | "overdue";
          attachment_name?: string | null;
          attachment_url?: string | null;
          class_ids?: string[];
          student_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          status: "assigned" | "submitted" | "graded";
          submitted_at: string | null;
          graded_at: string | null;
          grade: number | null;
          feedback: string | null;
          attachment_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          status?: "assigned" | "submitted" | "graded";
          submitted_at?: string | null;
          graded_at?: string | null;
          grade?: number | null;
          feedback?: string | null;
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          status?: "assigned" | "submitted" | "graded";
          submitted_at?: string | null;
          graded_at?: string | null;
          grade?: number | null;
          feedback?: string | null;
          attachment_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_assignment_submissions_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "teacher_assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teacher_assignment_submissions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      parents: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          address: string | null;
          madrassah_id: string | null;
          student_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          madrassah_id?: string | null;
          student_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          madrassah_id?: string | null;
          student_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Database["public"]["Views"];
    Functions: Database["public"]["Functions"];
    Enums: Database["public"]["Enums"];
    CompositeTypes: Database["public"]["CompositeTypes"];
  };
}

// Create the typed client
export const typedClient = createClient<CustomDatabase>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
      },
    },
  },
);

export type { CustomDatabase };
