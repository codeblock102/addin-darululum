
import { Tables } from "@/integrations/supabase/types";

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord {
  id: string;
  student_id?: string;
  class_id?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  created_at?: string;
  student?: any;
  class?: any;
}

export interface AttendanceFormData {
  class_id: string;
  student_id: string;
  date: Date;
  status: AttendanceStatus;
  notes?: string;
}
