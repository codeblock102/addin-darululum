import { StatusBadge, StatusType } from "@/components/ui/status-badge.tsx";

interface TeacherStatusBadgeProps {
  status: "active" | "suspended";
}

export function TeacherStatusBadge({
  status,
}: TeacherStatusBadgeProps) {
  return <StatusBadge status={status as StatusType} />;
}
