
export interface UserFormData {
  email: string;
  username: string;
  password: string;
  teacherId: string | null;
  role?: string;
}

export interface UserDialogProps {
  selectedUser?: {
    id: string;
    email: string;
    username: string;
    teacherId: string | null;
  } | null;
  teachers: {
    id: string;
    name: string;
  }[];
  onSuccess: () => void;
}

export interface FormErrors {
  [key: string]: string;
}
