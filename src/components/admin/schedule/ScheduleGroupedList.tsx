
import { Schedule } from "@/types/teacher";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { TimeSlot } from "@/types/teacher";

interface ScheduleGroupedListProps {
  groupedSchedules: Record<string, Schedule[]>;
  daysOfWeek: string[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const ScheduleGroupedList = ({ 
  groupedSchedules, 
  daysOfWeek,
  onEdit,
  onDelete,
  isDeleting
}: ScheduleGroupedListProps) => {
  const formatTimeSlot = (timeSlots: TimeSlot[]) => {
    if (!timeSlots || timeSlots.length === 0) return '';
    return `${timeSlots[0].start_time} - ${timeSlots[0].end_time}`;
  };

  return (
    <div className="space-y-6">
      {daysOfWeek.map((day) => {
        if (!groupedSchedules?.[day] || groupedSchedules[day].length === 0) return null;
        
        return (
          <div key={day} className="space-y-4">
            <h3 className="text-lg font-medium">{day}</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSchedules[day].map((schedule: Schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{formatTimeSlot(schedule.time_slots)}</TableCell>
                      <TableCell className="font-medium">{schedule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Unassigned</Badge>
                      </TableCell>
                      <TableCell>{schedule.room}</TableCell>
                      <TableCell>
                        <Badge variant={
                          schedule.current_students && schedule.capacity && 
                          schedule.current_students >= schedule.capacity ? "destructive" : "outline"
                        }>
                          {schedule.current_students || 0} / {schedule.capacity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(schedule)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDelete(schedule.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
