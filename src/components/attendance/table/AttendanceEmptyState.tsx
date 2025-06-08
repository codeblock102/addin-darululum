import { Button } from "@/components/ui/button.tsx";
import { CalendarCheck } from "lucide-react";

interface AttendanceEmptyStateProps {
  hasFilters?: boolean;
  resetFilters: () => void;
}

export function AttendanceEmptyState(
  { hasFilters = false, resetFilters }: AttendanceEmptyStateProps,
) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
        <CalendarCheck className="h-8 w-8 text-purple-500 dark:text-purple-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        No attendance records found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center max-w-md">
        Try adjusting your filters or select another date range to view
        attendance records.
      </p>
      {hasFilters && (
        <Button
          variant="outline"
          className="mt-4 border-purple-200 text-purple-600 h dark:border-purple-800 dark:text-purple-400 "
          onClick={resetFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
