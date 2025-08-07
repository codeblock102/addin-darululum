import * as z from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  teacher_ids: z.array(z.string()).optional(),
  time_start: z.string().min(1, "Start time is required"),
  time_end: z.string().min(1, "End time is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  days_of_week: z.array(z.string()).min(1, "Select at least one day"),
  subject: z.string().optional(),
  section: z.string().optional(),
});

export type ClassFormData = z.infer<typeof classSchema>;
