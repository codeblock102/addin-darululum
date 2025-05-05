
import { BookMarked } from "lucide-react";
import { ScheduleItem } from "./ScheduleItem";
import { ScheduleListProps } from "./types";

export const ScheduleList = ({ 
  schedules, 
  isLoading, 
  selectedStudentName, 
  onComplete, 
  onCancel 
}: ScheduleListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center p-6">
        <BookMarked className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-2 text-lg font-medium">No revisions found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {selectedStudentName 
            ? `There are no revisions scheduled for ${selectedStudentName}.` 
            : "There are no revisions scheduled."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <ScheduleItem 
          key={schedule.id} 
          schedule={schedule}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
};
