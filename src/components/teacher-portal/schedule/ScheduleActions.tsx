
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { ScheduleActionsProps } from "./types";

export const ScheduleActions = ({ tab }: ScheduleActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline">
        <Calendar className="mr-2 h-4 w-4" />
        View Calendar
      </Button>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        New Revision
      </Button>
    </div>
  );
};
