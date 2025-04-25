
import { z } from "zod";

const timeSlotSchema = z.object({
  days: z.array(z.string()).min(1, "At least one day must be selected"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
}).refine(data => data.start_time < data.end_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

export const scheduleFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacher_id: z.string().nullable(),
  room: z.string().min(1, "Room is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  time_slots: z.array(timeSlotSchema).min(1, "At least one time slot is required"),
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
