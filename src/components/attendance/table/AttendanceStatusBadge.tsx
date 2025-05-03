
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusType } from "@/components/ui/status-badge";

interface AttendanceStatusBadgeProps {
  status: string;
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  return <StatusBadge status={status as StatusType} />;
}
