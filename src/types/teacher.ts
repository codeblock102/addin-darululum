
export interface TeacherFormValues {
  name: string;
  bio?: string;
  email?: string;
  experience?: string;
  phone?: string;
  subject?: string;
  preferences?: Record<string, any>;
}

export interface TeacherPreferences {
  id: string;
  preferences?: Record<string, any>;
}

// Adding missing types referenced in other components
export interface Teacher {
  id: string;
  name: string;
  subject?: string;
  experience?: string;
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
}

// Updated Schedule type to match the database schema
export interface Schedule {
  id: string;
  name: string;         // This field stores the class name
  class_name?: string;  // For compatibility with existing components
  days_of_week: string[];
  time_slots: {
    days: string[];
    start_time: string;
    end_time: string;
  }[];
  room?: string;
  capacity?: number;
  current_students?: number;
  day_of_week?: string; // For compatibility with existing components
  time_slot?: string;   // For compatibility with existing components
}
