export type UserRole = "admin" | "teacher" | "parent";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  created_at: string;
  name?: string;
}

export interface StudentAssignment {
  id: string;
  teacher_id: string;
  student_name: string;
  active: boolean;
  assigned_date: string;
}

export interface Communication {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

// Admin user management types (consolidated from adminUser.ts)
export interface UserFormData {
  email: string;
  username: string;
  password: string;
  teacherId: string | null;
  role?: UserRole;
}

export interface FormErrors {
  [key: string]: string;
}

export interface UserDialogProps {
  selectedUser: {
    id: string;
    email: string;
    username: string;
    teacherId?: string | null;
    role?: UserRole;
  } | null;
  teachers: { id: string; name: string }[];
  onSuccess: () => void;
}