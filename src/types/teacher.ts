export interface Teacher {
  id: string;
  name: string;
  subject: string;
  experience: string;
  email?: string;
  bio?: string;
  phone?: string;
}

export interface TeacherDashboardProps {
  teacher: Teacher;
}

export interface SummaryData {
  studentsCount: number;
  recentProgressEntries: number;
  todayClasses: number;
  averageQuality?: string;
  totalRevisions?: number;
  pendingRevisions?: number;
}

// Supabase query result type
export interface SupabaseQueryResult<T> {
  data: T[] | null;
  error: Error | null;
}
