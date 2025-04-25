
import { z } from "zod";

export const scheduleFormSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  day_of_week: z.string().min(1, "Day of the week is required"),
  time_slot: z.string().min(1, "Time slot is required"),
  room: z.string().min(1, "Room is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  teacher_id: z.string().nullable(),
});

export type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
