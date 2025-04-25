
import { Button } from "@/components/ui/button";
import { RefreshCcw, PlusCircle } from "lucide-react";

interface ScheduleActionsProps {
  onRefresh: () => void;
  onAddSchedule: () => void;
}

export const ScheduleActions = ({ onRefresh, onAddSchedule }: ScheduleActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCcw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button onClick={onAddSchedule}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Schedule
      </Button>
    </div>
  );
};
