
import { AttendanceStatus } from "@/types/attendance.ts";

export type AttendanceFormValues = {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
  date: Date;
  time: string;
  late_reason?: string;
  class_id: string;
};
