import * as z from "zod";

export const revisionSchema = z.object({
  date: z.date(),
  memorization_quality: z.enum([
    "excellent",
    "good",
    "average",
    "needsWork",
    "horrible",
  ]),
  time_spent: z.number().min(0).max(60),
  notes: z.string().optional(),
});

export type RevisionFormValues = z.infer<typeof revisionSchema>;
