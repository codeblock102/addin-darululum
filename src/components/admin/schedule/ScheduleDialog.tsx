import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { scheduleFormSchema, ScheduleFormData, TimeSlot } from "./scheduleValidation";
import { useScheduleSubmit } from "./useScheduleSubmit";
import { ClassBasicInfo } from "./ClassBasicInfo";
import { ClassScheduleSelector } from "./ClassScheduleSelector";
import { Teacher } from "@/types/teacher";

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
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: "",
      teacher_id: null,
      room: "",
      capacity: 20,
      time_slots: [],
    }
  });
  
  const { data: teachers } = useQuery({
    queryKey: ['teachers-dropdown'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, name, subject, experience')
        .order('name');
      
      if (error) throw error;
      return data as Teacher[];
    }
  });
  
  useEffect(() => {
    if (open && schedule) {
      const formattedTimeSlots: TimeSlot[] = [];
      
      if (schedule.time_slots && Array.isArray(schedule.time_slots)) {
        schedule.time_slots.forEach((slot: any) => {
          formattedTimeSlots.push({
            days: Array.isArray(slot.days) ? slot.days : ['Monday'],
            start_time: slot.start_time || '09:00',
            end_time: slot.end_time || '10:00'
          });
        });
      }
      
      form.reset({
        name: schedule.name || "",
        teacher_id: schedule.teacher_id || null,
        room: schedule.room || "",
        capacity: schedule.capacity || 20,
        time_slots: formattedTimeSlots,
      });
    } else if (open) {
      form.reset({
        name: "",
        teacher_id: null,
        room: "",
        capacity: 20,
        time_slots: [],
      });
    }
  }, [open, schedule, form]);
  
  const scheduleMutation = useScheduleSubmit({
    schedule,
    onSuccess: () => onOpenChange(false)
  });
  
  const onSubmit = (data: ScheduleFormData) => {
    scheduleMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] dialog-content">
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ClassBasicInfo teachers={teachers} />
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ClassBasicInfo.RoomInput />
                </div>
                <div>
                  <ClassBasicInfo.CapacityInput />
                </div>
              </div>
            </div>
            
            <ClassScheduleSelector
              value={form.watch("time_slots")}
              onChange={(slots) => form.setValue("time_slots", slots, { shouldValidate: true })}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};
