import { Badge } from "@/components/ui/badge.tsx";

interface AttendanceStatusBadgeProps {
  status: string | undefined;
}

export const AttendanceStatusBadge = ({ status }: AttendanceStatusBadgeProps) => {
  if (!status) return <Badge variant="outline">Not Marked</Badge>;
  switch (status) {
    case "present":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-700 dark:text-green-100">
          Present
        </Badge>
      );
    case "absent":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-700 dark:text-red-100">
          Absent
        </Badge>
      );
    case "late":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-700 dark:text-yellow-100">
          Late
        </Badge>
      );
    case "excused":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-700 dark:text-blue-100">
          Excused
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-100">
          {status}
        </Badge>
      );
  }
};
