import { z } from "zod";

export const DhorBookEntrySchema = z.object({
  entry_date: z.date().optional(),
  sabak_para: z.string().optional(),
  sabaq_para_juz: z.number().min(1).max(30).optional(),
  sabaq_para_pages: z.number().min(0).optional(),
  dhor_1: z.string().optional(),
  dhor_1_mistakes: z.number().min(0).default(0),
  dhor_2: z.string().optional(),
  dhor_2_mistakes: z.number().min(0).default(0),
  dhor_juz: z.number().min(1).max(30).optional(),
  dhor_quarter_start: z.number().min(1).max(4).optional(),
  dhor_quarters_covered: z.number().min(1).max(4).optional(),
  comments: z.string().optional(),
  points: z.number().min(0).default(0),
  detention: z.boolean().default(false),
  current_surah: z.number().min(1).max(114).optional(),
  current_juz: z.number().min(1).max(30).optional(),
  start_ayat: z.number().min(1).optional(),
  end_ayat: z.number().min(1).optional(),
  memorization_quality: z.enum(["excellent", "good", "average", "needsWork", "horrible"]).optional(),
  revision_status: z.string().optional(),
  teacher_notes: z.string().optional(),
  quran_format: z.enum(["13", "15"]).default("15")
});

export type DhorBookEntryFormValues = z.infer<typeof DhorBookEntrySchema>;
