export interface StudentData {
  id: string;
  name: string;
}

export type StudentAttendanceRecord = {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  class_id: string | null;
  created_at: string | null;
  time: string | null;
  late_reason: string | null;
  student_id: string;
  student_name: string;
};

export interface StudentWithAttendance extends StudentData {
  status: string | undefined;
  notes: string | null | undefined;
  attendance_id: string | undefined;
}
