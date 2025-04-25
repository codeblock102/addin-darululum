
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, X } from "lucide-react";
import { ScheduleFormFields } from "./ScheduleFormFields";
import { Schedule } from "@/types/teacher";
import { TimeSlot } from "@/types/teacher";
import { scheduleFormSchema } from "./scheduleValidation";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  onSuccess?: (data?: any) => void;
  teacherId?: string;
}

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
  onSuccess,
  teacherId
}: ScheduleDialogProps) {
  const [formStep, setFormStep] = useState<"info" | "schedule" | "success" | "error">(
    "info"
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: any) => {
      try {
        const scheduleData = {
          name: formData.name,
          room: formData.room,
          capacity: formData.capacity,
          teacher_id: teacherId || schedule?.teacher_id || '',
          time_slots: formData.time_slots,
          days_of_week: Array.from(
            new Set(formData.time_slots.flatMap((slot: TimeSlot) => slot.days))
          )
        };
        
        if (schedule) {
          const { data, error } = await supabase
            .from('classes')
            .update(scheduleData)
            .eq('id', schedule.id)
            .select();
          
          if (error) throw error;
          return data;
        } else {
          const { data, error } = await supabase
            .from('classes')
            .insert([{
              ...scheduleData,
              current_students: 0,
              status: 'active'
            }])
            .select();
          
          if (error) throw error;
          return data;
        }
      } catch (error: any) {
        console.error("Error submitting schedule:", error);
        throw error;
      }
    },
    onSuccess: () => {
      setFormStep("success");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onOpenChange(false);
        setFormStep("info");
      }, 1500);
    },
    onError: () => {
      setFormStep("error");
    }
  });

  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: schedule?.name || "",
      days_of_week: schedule?.days_of_week || [],
      time_slots: schedule?.time_slots || [],
      capacity: schedule?.capacity || 20,
      room: schedule?.room || "",
      teacher_id: teacherId || schedule?.teacher_id || "",
    },
  });

  const onSubmit = async (data: any) => {
    // Ensure time slots have the correct structure
    const formattedTimeSlots: TimeSlot[] = data.time_slots.map((slot: any) => ({
      days: Array.isArray(slot.days) ? slot.days : [],
      start_time: slot.start_time || "",
      end_time: slot.end_time || ""
    }));
    
    const scheduleData = {
      ...data,
      time_slots: formattedTimeSlots
    };
    
    mutate(scheduleData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit Class Schedule" : "Create New Class Schedule"}
          </DialogTitle>
        </DialogHeader>

        {formStep === "info" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter capacity"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="room"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter room number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Next: Schedule</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {formStep === "schedule" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <ScheduleFormFields {...form} />

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setFormStep("info")}
                >
                  Back: Info
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      Submitting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    "Save Schedule"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {formStep === "success" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <Check className="h-10 w-10 text-green-500" />
            <h3 className="text-lg font-medium">Schedule Saved!</h3>
            <p className="text-muted-foreground">
              The class schedule has been successfully saved.
            </p>
          </div>
        )}

        {formStep === "error" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <X className="h-10 w-10 text-red-500" />
            <h3 className="text-lg font-medium">Error</h3>
            <p className="text-muted-foreground">
              There was an error saving the schedule. Please try again.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
