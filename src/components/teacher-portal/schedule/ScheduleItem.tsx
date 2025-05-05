
import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";
import { ScheduleItemProps } from "./types";

export const ScheduleItem = ({ schedule, onComplete, onCancel }: ScheduleItemProps) => {
  // Define status badge styles
  const getStatusBadge = (status: string, date: string) => {
    const scheduleDate = new Date(date);
    
    if (status === 'completed') {
      return <Badge>Completed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="outline">Cancelled</Badge>;
    } else if (status === 'postponed') {
      return <Badge variant="secondary">Postponed</Badge>;
    } else if (isToday(scheduleDate)) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Today</Badge>;
    } else if (isPast(scheduleDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 p-4 border rounded-lg">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{schedule.students?.name}</span>
          {getStatusBadge(schedule.status, schedule.scheduled_date)}
          {getPriorityBadge(schedule.priority)}
        </div>
        <div className="text-sm text-muted-foreground">
          Juz {schedule.juz_number}
          {schedule.surah_number && ` • Surah ${schedule.surah_number}`}
          {" • "}{format(new Date(schedule.scheduled_date), "MMM d, yyyy")}
        </div>
        {schedule.notes && (
          <div className="text-sm mt-1 italic">{schedule.notes}</div>
        )}
      </div>
      {schedule.status === 'pending' && (
        <div className="flex gap-2 self-end sm:self-auto">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onComplete(schedule.id)}
          >
            <Check className="mr-1 h-4 w-4" />
            Complete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(schedule.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
