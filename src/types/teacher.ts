import { Json } from "@/types/supabase.ts";

export interface TeacherFormValues {
  name: string;
  bio?: string;
  email?: string;
  phone?: string;
  subject?: string;
  preferences?: Json;
  grade?: number;
  createAccount?: boolean;
  generatePassword?: boolean;
  password?: string;
}

export interface TeacherPreferencesType {
  id: string;
  preferences?: Json;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  section?: string;
  email?: string;
  bio?: string;
  phone?: string;
  preferences?: Json;
  grade?: number;
  capabilities?: string[];
}

export interface TeacherAccount extends Teacher {
  userId: string | null;
  role: 'teacher' | 'admin' | null;
  status: "active" | "suspended" | "deleted";
  lastLogin: string | null;
  classesCount: number;
  studentsCount: number;
  created_at?: string;
  experience?: number;
}

export interface TeacherDashboardProps {
  teacher: Teacher;
}

export interface SummaryData {
  totalStudents: number;
  activeClasses: number;
  upcomingRevisions: number;
  completionRate: number;

  // Add missing fields referenced in components
  studentsCount: number;
  recentProgressEntries: number;
  todayClasses: number;
  averageQuality: string;
  totalRevisions: number;
  pendingRevisions: number;
  scheduledRevisions?: number;
}
