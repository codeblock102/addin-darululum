
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
    <div className="space-y-8">
      {daysOfWeek.map((day) => {
        if (!groupedSchedules?.[day] || groupedSchedules[day].length === 0) return null;
        
        return (
          <div key={day} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 px-4">{day}</h3>
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Class</TableHead>
                    <TableHead className="font-semibold">Teacher</TableHead>
                    <TableHead className="font-semibold">Room</TableHead>
                    <TableHead className="font-semibold">Students</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedSchedules[day].map((schedule: Schedule) => (
                    <TableRow key={schedule.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {formatTimeSlot(schedule.time_slots)}
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {schedule.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-600">
                          Unassigned
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{schedule.room}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            schedule.current_students && schedule.capacity && 
                            schedule.current_students >= schedule.capacity 
                              ? "destructive" 
                              : "outline"
                          }
                          className="font-medium"
                        >
                          {schedule.current_students || 0} / {schedule.capacity || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(schedule)}
                            className="hover:bg-gray-100"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(schedule.id)}
                            disabled={isDeleting}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
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
