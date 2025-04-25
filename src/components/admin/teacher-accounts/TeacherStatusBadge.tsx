
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface TeacherStatusBadgeProps {
  status: "active" | "suspended";
}

export function TeacherStatusBadge({ status }: TeacherStatusBadgeProps) {
  if (status === "active") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
        <Check className="h-3 w-3" />
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex w-fit items-center gap-1">
      <X className="h-3 w-3" />
      Suspended
    </Badge>
  );
}
