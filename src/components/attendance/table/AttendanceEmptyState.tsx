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
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
      <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
        <CalendarCheck className="h-8 w-8 text-purple-500" />
      </div>
      <h3 className="text-lg font-semibold text-black mb-2">No attendance records found</h3>
      <p className="text-black text-center max-w-md">
        {hasFilters 
          ? "No attendance records match your current filters. Try adjusting your search criteria."
          : "There are no attendance records for the selected criteria. Try adjusting your filters or check back later."
        }
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
