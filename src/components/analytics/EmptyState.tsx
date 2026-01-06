/**
 * Reusable Empty State Component
 * Displays a message when data exists but is empty or unavailable
 */

import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  message = "No data available",
  description,
  icon,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 space-y-4 ${className}`}>
      {icon || <AlertCircle className="h-8 w-8 text-gray-400" />}
      <p className="text-gray-600 font-medium">{message}</p>
      {description && (
        <p className="text-sm text-gray-500 max-w-md text-center">{description}</p>
      )}
    </div>
  );
}

