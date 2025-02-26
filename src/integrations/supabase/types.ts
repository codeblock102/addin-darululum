export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      juz: {
        Row: {
          id: string
          juz_number: number
          surah_list: string
        }
        Insert: {
          id?: string
          juz_number: number
          surah_list: string
        }
        Update: {
          id?: string
          juz_number?: number
          surah_list?: string
        }
        Relationships: []
      }
      juz_mastery: {
        Row: {
          consecutive_good_revisions: number | null
          created_at: string
          id: string
          juz_number: number
          last_revision_date: string | null
          mastery_level: Database["public"]["Enums"]["mastery_level"] | null
          revision_count: number | null
          student_id: string | null
        }
        Insert: {
          consecutive_good_revisions?: number | null
          created_at?: string
          id?: string
          juz_number: number
          last_revision_date?: string | null
          mastery_level?: Database["public"]["Enums"]["mastery_level"] | null
          revision_count?: number | null
          student_id?: string | null
        }
        Update: {
          consecutive_good_revisions?: number | null
          created_at?: string
          id?: string
          juz_number?: number
          last_revision_date?: string | null
          mastery_level?: Database["public"]["Enums"]["mastery_level"] | null
          revision_count?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "juz_mastery_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      juz_revisions: {
        Row: {
          created_at: string
          id: string
          juz_revised: number
          memorization_quality:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          revision_date: string
          student_id: string | null
          teacher_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          juz_revised: number
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          revision_date: string
          student_id?: string | null
          teacher_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          juz_revised?: number
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          revision_date?: string
          student_id?: string | null
          teacher_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "juz_revisions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_juz: number | null
          created_at: string
          current_juz: number | null
          current_surah: number | null
          date: string | null
          end_ayat: number | null
          id: string
          last_completed_surah: string | null
          last_revision_date: string | null
          memorization_quality:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          notes: string | null
          revision_status: string | null
          start_ayat: number | null
          student_id: string | null
          tajweed_level: string | null
          teacher_notes: string | null
          verses_memorized: number | null
        }
        Insert: {
          completed_juz?: number | null
          created_at?: string
          current_juz?: number | null
          current_surah?: number | null
          date?: string | null
          end_ayat?: number | null
          id?: string
          last_completed_surah?: string | null
          last_revision_date?: string | null
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          notes?: string | null
          revision_status?: string | null
          start_ayat?: number | null
          student_id?: string | null
          tajweed_level?: string | null
          teacher_notes?: string | null
          verses_memorized?: number | null
        }
        Update: {
          completed_juz?: number | null
          created_at?: string
          current_juz?: number | null
          current_surah?: number | null
          date?: string | null
          end_ayat?: number | null
          id?: string
          last_completed_surah?: string | null
          last_revision_date?: string | null
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          notes?: string | null
          revision_status?: string | null
          start_ayat?: number | null
          student_id?: string | null
          tajweed_level?: string | null
          teacher_notes?: string | null
          verses_memorized?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sabaq_para: {
        Row: {
          created_at: string
          id: string
          juz_number: number
          quality_rating: Database["public"]["Enums"]["quality_rating"]
          quarters_revised: Database["public"]["Enums"]["quarter_revised"]
          revision_date: string
          student_id: string | null
          teacher_notes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          juz_number: number
          quality_rating: Database["public"]["Enums"]["quality_rating"]
          quarters_revised: Database["public"]["Enums"]["quarter_revised"]
          revision_date: string
          student_id?: string | null
          teacher_notes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          juz_number?: number
          quality_rating?: Database["public"]["Enums"]["quality_rating"]
          quarters_revised?: Database["public"]["Enums"]["quarter_revised"]
          revision_date?: string
          student_id?: string | null
          teacher_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sabaq_para_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          date_of_birth: string | null
          enrollment_date: string | null
          guardian_contact: string | null
          guardian_name: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["student_status"] | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["student_status"] | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          enrollment_date?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["student_status"] | null
        }
        Relationships: []
      }
      students_teachers: {
        Row: {
          created_at: string
          id: string
          student_name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          student_name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          student_name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      surah: {
        Row: {
          id: string
          name: string
          surah_number: number
          total_ayat: number
        }
        Insert: {
          id?: string
          name: string
          surah_number: number
          total_ayat: number
        }
        Update: {
          id?: string
          name?: string
          surah_number?: number
          total_ayat?: number
        }
        Relationships: []
      }
      teachers: {
        Row: {
          created_at: string
          experience: string
          id: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          experience: string
          id?: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          experience?: string
          id?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      mastery_level: "not_started" | "in_progress" | "memorized" | "mastered"
      quality_rating:
        | "excellent"
        | "good"
        | "average"
        | "needsWork"
        | "horrible"
      quarter_revised:
        | "1st_quarter"
        | "2_quarters"
        | "3_quarters"
        | "4_quarters"
      student_status: "active" | "inactive"
      user_role: "admin" | "teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
