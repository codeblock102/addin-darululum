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
      attendance: {
        Row: {
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          late_reason: string | null
          notes: string | null
          status: string
          student_id: string | null
          time: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          late_reason?: string | null
          notes?: string | null
          status: string
          student_id?: string | null
          time?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          late_reason?: string | null
          notes?: string | null
          status?: string
          student_id?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          created_at: string | null
          current_students: number | null
          days_of_week: string[]
          description: string | null
          id: string
          name: string
          room: string | null
          status: string | null
          teacher_id: string | null
          time_slots: Json[] | null
        }
        Insert: {
          capacity?: number
          created_at?: string | null
          current_students?: number | null
          days_of_week?: string[]
          description?: string | null
          id?: string
          name: string
          room?: string | null
          status?: string | null
          teacher_id?: string | null
          time_slots?: Json[] | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          current_students?: number | null
          days_of_week?: string[]
          description?: string | null
          id?: string
          name?: string
          room?: string | null
          status?: string | null
          teacher_id?: string | null
          time_slots?: Json[] | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      juz: {
        Row: {
          id: number
          juz_number: number
          surah_list: string
        }
        Insert: {
          id: number
          juz_number: number
          surah_list: string
        }
        Update: {
          id?: number
          juz_number?: number
          surah_list?: string
        }
        Relationships: []
      }
      juz_revisions: {
        Row: {
          created_at: string
          dhor_slot: number | null
          id: string
          juz_number: number | null
          juz_revised: number
          memorization_quality:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          quarter_start: number | null
          quarters_covered: number | null
          revision_date: string
          student_id: string | null
          teacher_notes: string | null
        }
        Insert: {
          created_at?: string
          dhor_slot?: number | null
          id?: string
          juz_number?: number | null
          juz_revised: number
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          quarter_start?: number | null
          quarters_covered?: number | null
          revision_date: string
          student_id?: string | null
          teacher_notes?: string | null
        }
        Update: {
          created_at?: string
          dhor_slot?: number | null
          id?: string
          juz_number?: number | null
          juz_revised?: number
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null
          quarter_start?: number | null
          quarters_covered?: number | null
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
      madrassahs: {
        Row: {
          admin_id: string | null
          created_at: string | null
          id: string
          location: string | null
          name: string
          section: string[] | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          section?: string[] | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          section?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          madrassah_id: string | null
          name: string | null
          phone: string | null
          role: string | null
          section: string | null
          subject: string | null
          capabilities: Json
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          madrassah_id?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          section?: string | null
          subject?: string | null
          capabilities?: Json
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          madrassah_id?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          section?: string | null
          subject?: string | null
          capabilities?: Json
        }
        Relationships: [
          {
            foreignKeyName: "teachers_madrassah_id_fkey"
            columns: ["madrassah_id"]
            isOneToOne: false
            referencedRelation: "madrassahs"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_teachers: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          address: string | null
          madrassah_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          madrassah_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          madrassah_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed_juz: number[] | null
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
          pages_memorized: number | null
          revision_status: string | null
          start_ayat: number | null
          student_id: string | null
          teacher_notes: string | null
          verses_memorized: number | null
        }
        Insert: {
          completed_juz?: number[] | null
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
          pages_memorized?: number | null
          revision_status?: string | null
          start_ayat?: number | null
          student_id?: string | null
          teacher_notes?: string | null
          verses_memorized?: number | null
        }
        Update: {
          completed_juz?: number[] | null
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
          pages_memorized?: number | null
          revision_status?: string | null
          start_ayat?: number | null
          student_id?: string | null
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
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["role_permission"]
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["role_permission"]
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["role_permission"]
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sabaq_para: {
        Row: {
          created_at: string
          id: string
          juz_number: number
          quality_rating: Database["public"]["Enums"]["quality_rating"]
          quarters_revised: Database["public"]["Enums"]["quarter_revised"]
          revision_date: string
          sabaq_para_juz: number | null
          sabaq_para_pages: number | null
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
          sabaq_para_juz?: number | null
          sabaq_para_pages?: number | null
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
          sabaq_para_juz?: number | null
          sabaq_para_pages?: number | null
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
          completed_juz: number[] | null
          created_at: string
          current_juz: number | null
          date_of_birth: string | null
          enrollment_date: string | null
          guardian_contact: string | null
          guardian_email: string | null
          guardian_name: string | null
          id: string
          madrassah_id: string | null
          name: string
          section: string | null
          status: Database["public"]["Enums"]["student_status"] | null
        }
        Insert: {
          completed_juz?: number[] | null
          created_at?: string
          current_juz?: number | null
          date_of_birth?: string | null
          enrollment_date?: string | null
          guardian_contact?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          id?: string
          madrassah_id?: string | null
          name: string
          section?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
        }
        Update: {
          completed_juz?: number[] | null
          created_at?: string
          current_juz?: number | null
          date_of_birth?: string | null
          enrollment_date?: string | null
          guardian_contact?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          id?: string
          madrassah_id?: string | null
          name?: string
          section?: string | null
          status?: Database["public"]["Enums"]["student_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "students_madrassah_id_fkey"
            columns: ["madrassah_id"]
            isOneToOne: false
            referencedRelation: "madrassahs"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_children: {
        Row: {
          id: string
          parent_id: string
          student_id: string
          student_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          student_id: string
          student_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          student_id?: string
          student_ids?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          }
        ]
      }
      students_teachers: {
        Row: {
          active: boolean | null
          assigned_date: string | null
          created_at: string
          id: string
          student_name: string
          teacher_id: string
        }
        Insert: {
          active?: boolean | null
          assigned_date?: string | null
          created_at?: string
          id?: string
          student_name: string
          teacher_id: string
        }
        Update: {
          active?: boolean | null
          assigned_date?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      surah: {
        Row: {
          id: number
          name: string
          surah_number: number
          total_ayat: number
        }
        Insert: {
          id: number
          name: string
          surah_number: number
          total_ayat: number
        }
        Update: {
          id?: number
          name?: string
          surah_number?: number
          total_ayat?: number
        }
        Relationships: []
      }
      
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_edge_daily_report: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
      role_permission:
        | "view_reports"
        | "export_reports"
        | "manage_students"
        | "manage_teachers"
        | "manage_schedules"
        | "manage_roles"
        | "bulk_actions"
        | "manage_classes"
      student_status: "active" | "inactive"
      user_role: "admin" | "teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late"],
      mastery_level: ["not_started", "in_progress", "memorized", "mastered"],
      quality_rating: ["excellent", "good", "average", "needsWork", "horrible"],
      quarter_revised: [
        "1st_quarter",
        "2_quarters",
        "3_quarters",
        "4_quarters",
      ],
      role_permission: [
        "view_reports",
        "export_reports",
        "manage_students",
        "manage_teachers",
        "manage_schedules",
        "manage_roles",
        "bulk_actions",
        "manage_classes",
      ],
      student_status: ["active", "inactive"],
      user_role: ["admin", "teacher"],
    },
  },
} as const
