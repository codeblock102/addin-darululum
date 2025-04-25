
import { Button } from "@/components/ui/button";
import { RefreshCcw, PlusCircle } from "lucide-react";

interface ScheduleActionsProps {
  onRefresh: () => void;
  onAddSchedule: () => void;
}

export const ScheduleActions = ({ onRefresh, onAddSchedule }: ScheduleActionsProps) => {
  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        className="text-gray-600 hover:text-gray-800"
      >
        <RefreshCcw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
      <Button 
        onClick={onAddSchedule}
        className="bg-primary hover:bg-primary/90"
        size="sm"
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Class
      </Button>
    </div>
  );
};
