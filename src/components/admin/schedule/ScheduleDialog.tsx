
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2 } from "lucide-react";
import { scheduleFormSchema } from "./scheduleValidation";
import { ScheduleFormFields } from "./ScheduleFormFields";
import { useScheduleSubmit } from "./useScheduleSubmit";

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any | null;
}

export const ScheduleDialog = ({
  open,
  onOpenChange,
  schedule
}: ScheduleDialogProps) => {
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
  
  const scheduleMutation = useScheduleSubmit({
    schedule,
    onSuccess: () => onOpenChange(false)
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const formData = {
        name: className,
        day_of_week: day,
        time_slot: timeSlot,
        room,
        capacity: Number(capacity),
        teacher_id: teacherId,
      };
      
      scheduleFormSchema.parse(formData);
      
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
      
      scheduleMutation.mutate(formData);
    } catch (error) {
      if (error instanceof Error) {
        setErrors({
          form: error.message
        });
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
          
          <ScheduleFormFields
            className="space-y-4"
            day={day}
            setDay={setDay}
            timeSlot={timeSlot}
            setTimeSlot={setTimeSlot}
            room={room}
            setRoom={setRoom}
            capacity={capacity}
            setCapacity={setCapacity}
            teacherId={teacherId}
            setTeacherId={setTeacherId}
            teachers={teachers}
            errors={errors}
          />
          
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
