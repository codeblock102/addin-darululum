
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Custom database interface that extends the generated Database type
// with our manually defined tables for proper TypeScript support
interface CustomDatabase extends Database {
  public: {
    Tables: {
      attendance: Database['public']['Tables']['attendance'];
      communications: Database['public']['Tables']['communications'];
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
          last_revised: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string;
          surah_number: number;
          ayah_number: number;
          juz_number: number;
          date_added?: string;
          notes?: string;
          revision_count?: number;
          last_revised?: string | null;
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
          last_revised?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      juz: Database['public']['Tables']['juz'];
      juz_mastery: Database['public']['Tables']['juz_mastery'];
      juz_revisions: Database['public']['Tables']['juz_revisions'];
      profiles: Database['public']['Tables']['profiles'];
      progress: Database['public']['Tables']['progress'];
      revision_schedule: {
        Row: {
          id: string;
          student_id: string;
          juz_number: number;
          surah_number?: number;
          scheduled_date: string;
          priority: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string;
          juz_number: number;
          surah_number?: number;
          scheduled_date: string;
          priority?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          juz_number?: number;
          surah_number?: number;
          scheduled_date?: string;
          priority?: string;
          status?: string;
          created_at?: string;
        };
      };
      sabaq_para: Database['public']['Tables']['sabaq_para'];
      schedules: Database['public']['Tables']['schedules'];
      students: Database['public']['Tables']['students'];
      student_assignments: {
        Row: {
          id: string;
          student_id: string;
          assignment_date: string;
          surah_number: number;
          start_ayat: number;
          end_ayat: number;
          page_start?: number;
          page_end?: number;
          assignment_type: string;
          status: string;
          teacher_id?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string;
          assignment_date?: string;
          surah_number: number;
          start_ayat: number;
          end_ayat: number;
          page_start?: number;
          page_end?: number;
          assignment_type: string;
          status?: string;
          teacher_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          assignment_date?: string;
          surah_number?: number;
          start_ayat?: number;
          end_ayat?: number;
          page_start?: number;
          page_end?: number;
          assignment_type?: string;
          status?: string;
          teacher_id?: string;
          created_at?: string;
        };
      };
      students_teachers: Database['public']['Tables']['students_teachers'];
      surah: Database['public']['Tables']['surah'];
      teachers: Database['public']['Tables']['teachers'];
      users: Database['public']['Tables']['users'];
    };
    Views: {
      student_status_summary: {
        Row: {
          student_id: string;
          student_name: string;
          learning_type: string;
          pending_assignments: number;
          missed_assignments: number;
          pending_details: string | null;
        };
      };
    };
    Functions: {
      get_student_status: {
        Args: Record<string, never>;
        Returns: {
          student_id: string;
          student_name: string;
          learning_type: string;
          pending_assignments: number;
          missed_assignments: number;
          pending_details: string | null;
        }[];
      };
      generate_auto_rating: {
        Args: { mistakes: number };
        Returns: string;
      };
      mark_ayah_resolved: {
        Args: { ayah_id_param: string };
        Returns: undefined;
      };
    };
    Enums: Database['public']['Enums'];
  };
}

const SUPABASE_URL = "https://depsfpodwaprzxffdcks.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcHNmcG9kd2Fwcnp4ZmZkY2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkxNTM5NjAsImV4cCI6MjA1NDcyOTk2MH0.Ax6eLUm_0Dd-YU7fv8VcvstqphIQ61DDmbb6yrKT0mc";

// Export the typed supabase client to use in your application
export const typedSupabase = createClient<CustomDatabase>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
