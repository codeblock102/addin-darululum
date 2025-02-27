
export type UserRole = 'admin' | 'teacher';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  created_at: string;
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
