import * as z from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacher_id: z.string().optional(),
  room: z.string().min(1, "Room is required"),
  time_start: z.string().min(1, "Start time is required"),
  time_end: z.string().min(1, "End time is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  days_of_week: z.array(z.string()).min(1, "Select at least one day"),
});

export type ClassFormData = z.infer<typeof classSchema>;
