import { StatusType } from "@/components/ui/status-badge.tsx";

export type AttendanceRecord = {
  id: string;
  date: string;
  status: StatusType;
  notes?: string;
  students: {
    id: string;
    name: string;
  } | null;
  classes: {
    name?: string;
  } | null;
};
