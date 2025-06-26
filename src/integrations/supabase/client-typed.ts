import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const SUPABASE_URL = "https://depsfpodwaprzxffdcks.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcHNmcG9kd2Fwcnp4ZmZkY2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxNTM5NjAsImV4cCI6MjA1NDcyOTk2MH0.Ax6eLUm_0Dd-YU7fv8VcvstqphIQ61DDmbb6yrKT0mc";

/**
 * Custom Database type that extends the generated Database type
 * with additional types.
 */
interface CustomDatabase extends Database {
  public: {
    Tables: Database["public"]["Tables"] & {
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
        "Content-Type": "application/json",
        "Accept": "*/*",
        "apikey": SUPABASE_PUBLISHABLE_KEY,
      },
    },
  },
);

export type { CustomDatabase };
