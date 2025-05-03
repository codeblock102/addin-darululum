
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, CalendarX, Clock } from "lucide-react";

interface AttendanceStatusBadgeProps {
  status: string;
}

export function AttendanceStatusBadge({ status }: AttendanceStatusBadgeProps) {
  switch (status) {
    case "present":
      return (
        <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 flex items-center gap-1">
          <CalendarCheck className="h-3 w-3" />
          Present
        </Badge>
      );
    case "absent":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 flex items-center gap-1">
          <CalendarX className="h-3 w-3" />
          Absent
        </Badge>
      );
    case "late":
      return (
        <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Late
        </Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
}
