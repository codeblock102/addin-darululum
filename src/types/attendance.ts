
import { Tables } from "@/integrations/supabase/types";

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceRecord extends Tables<"attendance"> {
  student?: Tables<"students">;
  class_schedule?: Tables<"schedules">;
}

export interface AttendanceFormData {
  class_schedule_id: string;
  student_id: string;
  date: Date;
  status: AttendanceStatus;
  notes?: string;
}
