import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { z } from "zod";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any | null;
}

interface ScheduleFormData {
  name: string;
  day_of_week: string;
  time_slot: string;
  room: string;
  capacity: number;
  teacher_id: string | null;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const ScheduleDialog = ({
  open,
  onOpenChange,
  schedule
}: ScheduleDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [className, setClassName] = useState("");
  const [day, setDay] = useState<string>("");
  const [timeSlot, setTimeSlot] = useState("");
  const [room, setRoom] = useState("");
  const [capacity, setCapacity] = useState("20");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form when dialog opens/closes or schedule changes
  useEffect(() => {
    if (open && schedule) {
      setClassName(schedule.name || schedule.class_name);
      setDay(schedule.days_of_week?.[0] || schedule.day_of_week || "");
      setTimeSlot(
        schedule.time_slots?.[0] 
          ? `${schedule.time_slots[0].start_time} - ${schedule.time_slots[0].end_time}`
          : schedule.time_slot || ""
      );
      setRoom(schedule.room || "");
      setCapacity(schedule.capacity?.toString() || "20");
      setTeacherId(schedule.teacher_id || null);
    } else if (open) {
      setClassName("");
      setDay("");
      setTimeSlot("");
      setRoom("");
      setCapacity("20");
      setTeacherId(null);
    }
    
    setErrors({});
  }, [open, schedule]);
  
  // Fetch teachers for dropdown
  const { data: teachers } = useQuery({
    queryKey: ['teachers-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });
  
  // Create/update schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async (formData: ScheduleFormData) => {
      const timeParts = formData.time_slot.split('-').map(part => part.trim());
      const start_time = timeParts[0];
      const end_time = timeParts[1] || start_time;
      
      const scheduleData = {
        name: formData.name,
        days_of_week: [formData.day_of_week],
        time_slots: [{
          days: [formData.day_of_week],
          start_time,
          end_time
        }],
        room: formData.room,
        capacity: formData.capacity,
        teacher_id: formData.teacher_id,
        // Keep these for backwards compatibility
        day_of_week: formData.day_of_week,
        time_slot: formData.time_slot,
      };
      
      if (schedule) {
        // Update existing schedule
        const { data, error } = await supabase
          .from('classes')
          .update(scheduleData)
          .eq('id', schedule.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Create new schedule
        const { data, error } = await supabase
          .from('classes')
          .insert([{
            ...scheduleData,
            current_students: 0
          }])
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-schedule'] });
      
      toast({
        title: schedule ? "Schedule updated" : "Schedule created",
        description: schedule 
          ? "The schedule has been updated successfully."
          : "A new schedule has been created successfully."
      });
      
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${schedule ? 'update' : 'create'} schedule: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Validate and submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    const formSchema = z.object({
      name: z.string().min(1, "Class name is required"),
      day_of_week: z.string().min(1, "Day of the week is required"),
      time_slot: z.string().min(1, "Time slot is required"),
      room: z.string().min(1, "Room is required"),
      capacity: z.number().min(1, "Capacity must be at least 1"),
    });
    
    try {
      formSchema.parse({
        name: className,
        day_of_week: day,
        time_slot: timeSlot,
        room,
        capacity: Number(capacity)
      });
      
      // Check for schedule conflicts
      if (!schedule) {
        const { data: conflicts } = await supabase
          .from('classes')
          .select('id')
          .eq('days_of_week', [day])
          .eq('room', room);
        
        if (conflicts && conflicts.length > 0) {
          setErrors({
            room: "This room is already scheduled for this time slot",
          });
          return;
        }
      }
      
      // Submit form data
      scheduleMutation.mutate({
        name: className,
        day_of_week: day,
        time_slot: timeSlot,
        room,
        capacity: Number(capacity),
        teacher_id: teacherId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Schedule" : "Create New Schedule"}
          </DialogTitle>
          <DialogDescription>
            {schedule 
              ? "Update the details of this class schedule." 
              : "Add a new class to the teaching schedule."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name</Label>
            <Input
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className={errors.class_name ? "border-destructive" : ""}
            />
            {errors.class_name && (
              <p className="text-xs text-destructive">{errors.class_name}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className={errors.day_of_week ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
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
          
          <div className="grid grid-cols-2 gap-4">
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
          
          <div className="space-y-2">
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
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={scheduleMutation.isPending}
              onClick={handleSubmit}
            >
              {scheduleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {schedule ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{schedule ? "Update Schedule" : "Create Schedule"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
