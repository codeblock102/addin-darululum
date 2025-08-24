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
