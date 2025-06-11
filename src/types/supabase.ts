export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          class_id: string | null;
          created_at: string | null;
          date: string;
          id: string;
          notes: string | null;
          status: string;
          student_id: string | null;
        };
        Insert: {
          class_id?: string | null;
          created_at?: string | null;
          date: string;
          id?: string;
          notes?: string | null;
          status: string;
          student_id?: string | null;
        };
        Update: {
          class_id?: string | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          notes?: string | null;
          status?: string;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      class_enrollments: {
        Row: {
          class_id: string | null;
          enrolled_date: string | null;
          id: string;
          status: string | null;
          student_id: string | null;
        };
        Insert: {
          class_id?: string | null;
          enrolled_date?: string | null;
          id?: string;
          status?: string | null;
          student_id?: string | null;
        };
        Update: {
          class_id?: string | null;
          enrolled_date?: string | null;
          id?: string;
          status?: string | null;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          capacity: number;
          created_at: string | null;
          current_students: number | null;
          days_of_week: string[];
          description: string | null;
          id: string;
          name: string;
          room: string | null;
          status: string | null;
          teacher_id: string | null;
          time_slots: Json[] | null;
        };
        Insert: {
          capacity?: number;
          created_at?: string | null;
          current_students?: number | null;
          days_of_week?: string[];
          description?: string | null;
          id?: string;
          name: string;
          room?: string | null;
          status?: string | null;
          teacher_id?: string | null;
          time_slots?: Json[] | null;
        };
        Update: {
          capacity?: number;
          created_at?: string | null;
          current_students?: number | null;
          days_of_week?: string[];
          description?: string | null;
          id?: string;
          name?: string;
          room?: string | null;
          status?: string | null;
          teacher_id?: string | null;
          time_slots?: Json[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ];
      };
      communications: {
        Row: {
          attachment_url: string | null;
          category: string | null;
          created_at: string | null;
          id: string;
          message: string;
          message_status: string | null;
          message_type: string | null;
          parent_message_id: string | null;
          read: boolean | null;
          recipient_id: string | null;
          sender_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          attachment_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          message: string;
          message_status?: string | null;
          message_type?: string | null;
          parent_message_id?: string | null;
          read?: boolean | null;
          recipient_id?: string | null;
          sender_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          attachment_url?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          message?: string;
          message_status?: string | null;
          message_type?: string | null;
          parent_message_id?: string | null;
          read?: boolean | null;
          recipient_id?: string | null;
          sender_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "communications_parent_message_id_fkey";
            columns: ["parent_message_id"];
            isOneToOne: false;
            referencedRelation: "communications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "communications_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      juz: {
        Row: {
          id: number;
          juz_number: number;
          surah_list: string;
        };
        Insert: {
          id: number;
          juz_number: number;
          surah_list: string;
        };
        Update: {
          id?: number;
          juz_number?: number;
          surah_list?: string;
        };
        Relationships: [];
      };
      juz_mastery: {
        Row: {
          consecutive_good_revisions: number | null;
          created_at: string;
          id: string;
          juz_number: number;
          last_revision_date: string | null;
          mastery_level: Database["public"]["Enums"]["mastery_level"] | null;
          revision_count: number | null;
          student_id: string | null;
        };
        Insert: {
          consecutive_good_revisions?: number | null;
          created_at?: string;
          id?: string;
          juz_number: number;
          last_revision_date?: string | null;
          mastery_level?: Database["public"]["Enums"]["mastery_level"] | null;
          revision_count?: number | null;
          student_id?: string | null;
        };
        Update: {
          consecutive_good_revisions?: number | null;
          created_at?: string;
          id?: string;
          juz_number?: number;
          last_revision_date?: string | null;
          mastery_level?: Database["public"]["Enums"]["mastery_level"] | null;
          revision_count?: number | null;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "juz_mastery_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      juz_revisions: {
        Row: {
          created_at: string;
          dhor_slot: number | null;
          id: string;
          juz_number: number | null;
          juz_revised: number;
          memorization_quality:
            | Database["public"]["Enums"]["quality_rating"]
            | null;
          quarter_start: number | null;
          quarters_covered: number | null;
          revision_date: string;
          student_id: string | null;
          teacher_notes: string | null;
        };
        Insert: {
          created_at?: string;
          dhor_slot?: number | null;
          id?: string;
          juz_number?: number | null;
          juz_revised: number;
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null;
          quarter_start?: number | null;
          quarters_covered?: number | null;
          revision_date: string;
          student_id?: string | null;
          teacher_notes?: string | null;
        };
        Update: {
          created_at?: string;
          dhor_slot?: number | null;
          id?: string;
          juz_number?: number | null;
          juz_revised?: number;
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null;
          quarter_start?: number | null;
          quarters_covered?: number | null;
          revision_date?: string;
          student_id?: string | null;
          teacher_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "juz_revisions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      parent_comments: {
        Row: {
          comment: string;
          created_at: string;
          entry_date: string;
          id: string;
          student_id: string | null;
          updated_at: string;
        };
        Insert: {
          comment: string;
          created_at?: string;
          entry_date: string;
          id?: string;
          student_id?: string | null;
          updated_at?: string;
        };
        Update: {
          comment?: string;
          created_at?: string;
          entry_date?: string;
          id?: string;
          student_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "parent_comments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          name: string | null;
          id: string;
          role: string | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          name?: string | null;
          id: string;
          role?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          name?: string | null;
          id?: string;
          role?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          completed_juz: number[] | null;
          created_at: string;
          current_juz: number | null;
          current_surah: number | null;
          date: string | null;
          end_ayat: number | null;
          id: string;
          last_completed_surah: string | null;
          last_revision_date: string | null;
          memorization_quality:
            | Database["public"]["Enums"]["quality_rating"]
            | null;
          notes: string | null;
          pages_memorized: number | null;
          revision_status: string | null;
          start_ayat: number | null;
          student_id: string | null;
          teacher_notes: string | null;
          verses_memorized: number | null;
        };
        Insert: {
          completed_juz?: number[] | null;
          created_at?: string;
          current_juz?: number | null;
          current_surah?: number | null;
          date?: string | null;
          end_ayat?: number | null;
          id?: string;
          last_completed_surah?: string | null;
          last_revision_date?: string | null;
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null;
          notes?: string | null;
          pages_memorized?: number | null;
          revision_status?: string | null;
          start_ayat?: number | null;
          student_id?: string | null;
          teacher_notes?: string | null;
          verses_memorized?: number | null;
        };
        Update: {
          completed_juz?: number[] | null;
          created_at?: string;
          current_juz?: number | null;
          current_surah?: number | null;
          date?: string | null;
          end_ayat?: number | null;
          id?: string;
          last_completed_surah?: string | null;
          last_revision_date?: string | null;
          memorization_quality?:
            | Database["public"]["Enums"]["quality_rating"]
            | null;
          notes?: string | null;
          pages_memorized?: number | null;
          revision_status?: string | null;
          start_ayat?: number | null;
          student_id?: string | null;
          teacher_notes?: string | null;
          verses_memorized?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "progress_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          id: string;
          permission: Database["public"]["Enums"]["role_permission"];
          role_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          permission: Database["public"]["Enums"]["role_permission"];
          role_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          permission?: Database["public"]["Enums"]["role_permission"];
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sabaq_para: {
        Row: {
          created_at: string;
          id: string;
          juz_number: number;
          quality_rating: Database["public"]["Enums"]["quality_rating"];
          quarters_revised: Database["public"]["Enums"]["quarter_revised"];
          revision_date: string;
          sabaq_para_juz: number | null;
          sabaq_para_pages: number | null;
          student_id: string | null;
          teacher_notes: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          juz_number: number;
          quality_rating: Database["public"]["Enums"]["quality_rating"];
          quarters_revised: Database["public"]["Enums"]["quarter_revised"];
          revision_date: string;
          sabaq_para_juz?: number | null;
          sabaq_para_pages?: number | null;
          student_id?: string | null;
          teacher_notes?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          juz_number?: number;
          quality_rating?: Database["public"]["Enums"]["quality_rating"];
          quarters_revised?: Database["public"]["Enums"]["quarter_revised"];
          revision_date?: string;
          sabaq_para_juz?: number | null;
          sabaq_para_pages?: number | null;
          student_id?: string | null;
          teacher_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sabaq_para_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_dhor_summaries: {
        Row: {
          created_at: string;
          days_absent: number;
          id: string;
          last_entry_date: string;
          last_updated_by: string | null;
          signature: string | null;
          student_id: string | null;
          total_points: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          days_absent?: number;
          id?: string;
          last_entry_date?: string;
          last_updated_by?: string | null;
          signature?: string | null;
          student_id?: string | null;
          total_points?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          days_absent?: number;
          id?: string;
          last_entry_date?: string;
          last_updated_by?: string | null;
          signature?: string | null;
          student_id?: string | null;
          total_points?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_dhor_summaries_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          completed_juz: number[] | null;
          created_at: string;
          current_juz: number | null;
          date_of_birth: string | null;
          enrollment_date: string | null;
          guardian_contact: string | null;
          guardian_name: string | null;
          id: string;
          name: string;
          medical_condition: string | null;
          status: Database["public"]["Enums"]["student_status"] | null;
        };
        Insert: {
          completed_juz?: number[] | null;
          created_at?: string;
          current_juz?: number | null;
          date_of_birth?: string | null;
          enrollment_date?: string | null;
          guardian_contact?: string | null;
          guardian_name?: string | null;
          id?: string;
          name: string;
          medical_condition?: string | null;
          status?: Database["public"]["Enums"]["student_status"] | null;
        };
        Update: {
          completed_juz?: number[] | null;
          created_at?: string;
          current_juz?: number | null;
          date_of_birth?: string | null;
          enrollment_date?: string | null;
          guardian_contact?: string | null;
          guardian_name?: string | null;
          id?: string;
          name?: string;
          medical_condition?: string | null;
          status?: Database["public"]["Enums"]["student_status"] | null;
        };
        Relationships: [];
      };
      students_teachers: {
        Row: {
          active: boolean | null;
          assigned_date: string | null;
          created_at: string;
          id: string;
          student_name: string;
          teacher_id: string;
        };
        Insert: {
          active?: boolean | null;
          assigned_date?: string | null;
          created_at?: string;
          id?: string;
          student_name: string;
          teacher_id: string;
        };
        Update: {
          active?: boolean | null;
          assigned_date?: string | null;
          created_at?: string;
          id?: string;
          student_name?: string;
          teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_teachers_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          },
        ];
      };
      surah: {
        Row: {
          id: number;
          name: string;
          surah_number: number;
          total_ayat: number;
        };
        Insert: {
          id: number;
          name: string;
          surah_number: number;
          total_ayat: number;
        };
        Update: {
          id?: number;
          name?: string;
          surah_number?: number;
          total_ayat?: number;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          created_at: string;
          id: string;
          settings: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          settings?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      teachers: {
        Row: {
          bio: string | null;
          created_at: string;
          email: string | null;
          experience: string;
          id: string;
          name: string;
          phone: string | null;
          subject: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          experience: string;
          id?: string;
          name: string;
          phone?: string | null;
          subject: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          email?: string | null;
          experience?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          subject?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          username: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          role: Database["public"]["Enums"]["user_role"];
          username: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          username?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_permission: {
        Args: {
          user_id: string;
          required_permission: Database["public"]["Enums"]["role_permission"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      attendance_status: "present" | "absent" | "late";
      mastery_level: "not_started" | "in_progress" | "memorized" | "mastered";
      quality_rating:
        | "excellent"
        | "good"
        | "average"
        | "needsWork"
        | "horrible";
      quarter_revised:
        | "1st_quarter"
        | "2_quarters"
        | "3_quarters"
        | "4_quarters";
      role_permission:
        | "view_reports"
        | "export_reports"
        | "manage_students"
        | "manage_teachers"
        | "manage_schedules"
        | "manage_roles"
        | "bulk_actions"
        | "manage_classes";
      student_status: "active" | "inactive";
      user_role: "admin" | "teacher";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  } ? keyof (
      & Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
      & Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
    )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database } ? (
    & Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    & Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
  )[TableName] extends {
    Row: infer R;
  } ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (
    & DefaultSchema["Tables"]
    & DefaultSchema["Views"]
  ) ? (
      & DefaultSchema["Tables"]
      & DefaultSchema["Views"]
    )[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    } ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][
    TableName
  ] extends {
    Insert: infer I;
  } ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    } ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][
    TableName
  ] extends {
    Update: infer U;
  } ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    } ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]][
      "CompositeTypes"
    ]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][
    CompositeTypeName
  ]
  : PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

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
} as const;
