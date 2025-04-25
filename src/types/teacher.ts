export interface TeacherFormValues {
  name: string;
  bio?: string;
  email?: string;
  experience?: string;
  phone?: string;
  subject?: string;
  preferences?: Record<string, any>;
}

export interface TeacherPreferencesType {
  id: string;
  preferences?: Record<string, any>;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;  // Made this required to match database schema
  experience: string; // Made this required to match database schema
  email?: string;
  bio?: string;
  phone?: string;
  preferences?: Record<string, any>;
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
}

// Updated Schedule type to match the database schema
export interface Schedule {
  id: string;
  name: string;         // This field stores the class name
  class_name?: string;  // For compatibility with existing components
  days_of_week: string[];
  time_slots: TimeSlot[];
  room?: string;
  capacity?: number;
  current_students?: number;
  teacher_id?: string;
  
  // Deprecated fields - kept for compatibility with existing components
  day_of_week?: string;
  time_slot?: string;
}

// Added TimeSlot interface for improved type checking
export interface TimeSlot {
  days?: string[];
  start_time: string;
  end_time: string;
}
