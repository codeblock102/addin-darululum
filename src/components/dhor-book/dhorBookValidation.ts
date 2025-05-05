
import * as z from "zod";

export const DhorBookEntrySchema = z.object({
  entry_date: z.date(),
  day_of_week: z.string().optional(),
  sabak: z.string().optional(),
  sabak_para: z.string().optional(),
  dhor_1: z.string().optional(),
  dhor_1_mistakes: z.coerce.number().min(0),
  dhor_2: z.string().optional(),
  dhor_2_mistakes: z.coerce.number().min(0),
  comments: z.string().optional(),
  points: z.coerce.number().min(0),
  detention: z.boolean().default(false),
  
  // Additional progress fields
  current_surah: z.coerce.number().min(1).max(114).optional(),
  current_juz: z.coerce.number().min(1).max(30).optional(),
  verses_memorized: z.coerce.number().min(0).optional(),
  memorization_quality: z.enum(['excellent', 'good', 'average', 'needsWork', 'horrible']).optional(),
  tajweed_level: z.string().optional(),
  revision_status: z.string().optional(),
  teacher_notes: z.string().optional()
});

export type DhorBookEntryFormValues = z.infer<typeof DhorBookEntrySchema>;
