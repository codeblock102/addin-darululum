
export type UserRole = 'admin' | 'teacher' | 'student';

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
