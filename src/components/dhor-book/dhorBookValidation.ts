
import { z } from "zod";

export const DhorBookEntrySchema = z.object({
  entry_date: z.date().optional(),
  sabak: z.string().optional(),
  sabak_para: z.string().optional(),
  dhor_1: z.string().optional(),
  dhor_1_mistakes: z.number().min(0).default(0),
  dhor_2: z.string().optional(),
  dhor_2_mistakes: z.number().min(0).default(0),
  comments: z.string().optional(),
  points: z.number().min(0).default(0),
  detention: z.boolean().default(false),
  current_surah: z.number().min(1).max(114).optional(),
  current_juz: z.number().min(1).max(30).optional(),
  start_ayat: z.number().min(1).optional(),
  end_ayat: z.number().min(1).optional(),
  verses_memorized: z.number().min(0).optional(),
  memorization_quality: z.enum(["excellent", "good", "average", "needsWork", "horrible"]).default("average"),
  tajweed_level: z.string().optional(),
  revision_status: z.string().optional(),
  teacher_notes: z.string().optional()
});

export type DhorBookEntryFormValues = z.infer<typeof DhorBookEntrySchema>;
