import { StatusType } from "@/components/ui/status-badge.tsx";
import { Tables } from "@/integrations/supabase/types.ts";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  student_id?: string;
  class_id?: string;
  date: string;
  status: StatusType;
  notes?: string;
  created_at?: string;
  student?: Tables<"students">;
  class?: Tables<"classes">;
}

export interface AttendanceFormData {
  class_id: string;
  student_id: string;
  date: Date;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceEntry {
  id?: string;
  student_id: string;
  class_id?: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  created_at?: string;
}
