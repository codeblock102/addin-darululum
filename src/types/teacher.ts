
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
