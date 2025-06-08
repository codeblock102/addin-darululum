import { StatusBadge } from "@/components/ui/status-badge.tsx";
import { StatusType } from "@/components/ui/status-badge.tsx";

interface AttendanceStatusBadgeProps {
  status: StatusType;
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  return <StatusBadge status={status as StatusType} />;
}
