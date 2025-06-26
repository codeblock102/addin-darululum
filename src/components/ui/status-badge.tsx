import { Badge } from "@/components/ui/badge.tsx";
import {
  AlertCircle,
  CalendarCheck,
  CalendarX,
  Check,
  Clock,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

export type StatusType =
  // Attendance statuses
  | "present"
  | "absent"
  | "late"
  // Teacher/user statuses
  | "active"
  | "suspended"
  | "pending"
  // Progress statuses
  | "excellent"
  | "good"
  | "average"
  | "needsWork"
  | "horrible"
  // Revision statuses
  | "completed"
  | "skipped"
  | "scheduled"
  // General statuses
  | "success"
  | "error"
  | "warning"
  | "info"
  | "default";

export interface StatusBadgeProps {
  status: StatusType;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  customLabel?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  size = "md",
  className,
  customLabel,
}: StatusBadgeProps) {
  // Map size to class
  const sizeClasses = {
    sm: "text-xs py-0 px-1.5",
    md: "text-xs py-0.5 px-2.5",
    lg: "text-sm py-1 px-3",
  };

  // Function to get appropriate icon based on status
  const getIcon = () => {
    switch (status) {
      case "present":
        return (
          <CalendarCheck
            className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")}
          />
        );
      case "absent":
        return (
          <CalendarX
            className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")}
          />
        );
      case "late":
        return (
          <Clock className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")} />
        );
      case "active":
      case "good":
      case "completed":
      case "success":
        return (
          <Check className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")} />
        );
      case "suspended":
      case "horrible":
      case "needsWork":
      case "error":
        return <X className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")} />;
      case "warning":
      case "skipped":
        return (
          <AlertCircle
            className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")}
          />
        );
      case "info":
      case "pending":
      case "scheduled":
        return (
          <Info className={cn("h-3 w-3", size === "lg" ? "h-4 w-4" : "")} />
        );
      default:
        return null;
    }
  };

  // Function to get style based on status
  const getStyle = () => {
    switch (status) {
      case "present":
      case "active":
      case "completed":
      case "success":
      case "excellent":
      case "good":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";

      case "absent":
      case "suspended":
      case "error":
      case "horrible":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";

      case "late":
      case "warning":
      case "needsWork":
      case "skipped":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";

      case "info":
      case "pending":
      case "scheduled":
      case "average":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800";
    }
  };

  // Function to get label based on status
  const getLabel = () => {
    if (customLabel) return customLabel;

    switch (status) {
      case "present":
        return "Present";
      case "absent":
        return "Absent";
      case "late":
        return "Late";
      case "active":
        return "Active";
      case "suspended":
        return "Suspended";
      case "pending":
        return "Pending";
      case "excellent":
        return "Excellent";
      case "good":
        return "Good";
      case "average":
        return "Average";
      case "needsWork":
        return "Needs Work";
      case "horrible":
        return "Needs Review";
      case "completed":
        return "Completed";
      case "skipped":
        return "Skipped";
      case "scheduled":
        return "Scheduled";
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      case "info":
        return "Info";
      default:
        return "Unknown";
    }
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        getStyle(),
        sizeClasses[size],
        "flex items-center gap-1 w-fit",
        className,
      )}
    >
      {showIcon && getIcon()}
      <span>{getLabel()}</span>
    </Badge>
  );
}
