
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScheduleFormFieldsProps {
  className: string;
  day: string;
  setDay: (value: string) => void;
  timeSlot: string;
  setTimeSlot: (value: string) => void;
  room: string;
  setRoom: (value: string) => void;
  capacity: string;
  setCapacity: (value: string) => void;
  teacherId: string | null;
  setTeacherId: (value: string | null) => void;
  teachers?: { id: string; name: string; }[];
  errors: Record<string, string>;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ScheduleFormFields = ({
  className,
  day,
  setDay,
  timeSlot,
  setTimeSlot,
  room,
  setRoom,
  capacity,
  setCapacity,
  teacherId,
  setTeacherId,
  teachers,
  errors,
}: ScheduleFormFieldsProps) => {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="day">Day of Week</Label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className={errors.day_of_week ? "border-destructive" : ""}>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.day_of_week && (
            <p className="text-xs text-destructive">{errors.day_of_week}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="timeSlot">Time Slot</Label>
          <Input
            id="timeSlot"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            placeholder="e.g. 9:00 AM - 10:30 AM"
            className={errors.time_slot ? "border-destructive" : ""}
          />
          {errors.time_slot && (
            <p className="text-xs text-destructive">{errors.time_slot}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="room">Room</Label>
          <Input
            id="room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className={errors.room ? "border-destructive" : ""}
          />
          {errors.room && (
            <p className="text-xs text-destructive">{errors.room}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min={1}
            className={errors.capacity ? "border-destructive" : ""}
          />
          {errors.capacity && (
            <p className="text-xs text-destructive">{errors.capacity}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <Label htmlFor="teacher">Assign Teacher (Optional)</Label>
        <Select value={teacherId || "unassigned"} onValueChange={(value) => setTeacherId(value === "unassigned" ? null : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">None (Unassigned)</SelectItem>
            {teachers?.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
