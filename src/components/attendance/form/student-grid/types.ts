
export interface Student {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  section?: string;
}

export interface StudentGridProps {
  form: any;
  selectedClassId: string;
  multiSelect?: boolean;
  selectedStudents?: Set<string>;
  onStudentSelect?: (studentId: string) => void;
}
