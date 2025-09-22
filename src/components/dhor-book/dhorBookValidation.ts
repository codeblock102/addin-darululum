import { z } from "zod";

// Renamed schema to reflect its use for the new entry form structure
export const DailyActivityFormSchema = z.object({
  entry_date: z.date().optional(), // Should this be required? Handled by form default.

  // Sabaq (Main Lesson) - from progress table
  current_juz: z.number().min(1).max(30).optional(),
  current_surah: z.number().min(1).max(114).optional(),
  start_ayat: z.number().min(1).optional(),
  end_ayat: z.number().min(1).optional(),
  memorization_quality: z.enum([
    "excellent",
    "good",
    "average",
    "needsWork",
    "horrible",
  ]).optional(), // For Sabaq quality
  quran_format: z.enum(["13", "15"]).default("13"), // Usually tied to Sabaq

  // Sabaq Para (Additional Reading) - from sabaq_para table
  sabaq_para_juz: z.number().min(1).max(30).optional(),
  sabaq_para_pages: z.number().min(0).optional(), // Not directly in sabaq_para schema yet, but in form
  sabaq_para_memorization_quality: z.enum([
    "excellent",
    "good",
    "average",
    "needsWork",
    "horrible",
  ]).optional(), // Specific quality for Sabaq Para
  quarters_revised: z.enum([
    "1st_quarter",
    "2_quarters",
    "3_quarters",
    "4_quarters",
  ]).optional(), // Expected by sabaq_para table

  // Dhor (Revision) - from juz_revisions table (single set of fields)
  dhor_juz: z.number().min(1).max(30).optional(),
  dhor_memorization_quality: z.enum([
    "excellent",
    "good",
    "average",
    "needsWork",
    "horrible",
  ]).optional(),
  dhor_quarter_start: z.number().min(1).max(4).optional(),
  dhor_quarters_covered: z.number().min(1).max(4).optional(),

  // Nazirah & Qaida tab
  naz_qaida_type: z.enum(["nazirah", "qaida"]).optional(),
  // Nazirah reading uses juz/surah/ayat like sabaq
  nazirah_juz: z.number().min(1).max(30).optional(),
  nazirah_surah: z.number().min(1).max(114).optional(),
  nazirah_start_ayat: z.number().min(1).optional(),
  nazirah_end_ayat: z.number().min(1).optional(),
  nazirah_memorization_quality: z.enum([
    "excellent",
    "good",
    "average",
    "needsWork",
    "horrible",
  ]).optional(),
  // Qaida lesson selection
  qaida_lesson: z.string().optional(),
  qaida_memorization_quality: z.enum([
    "excellent",
    "good",
    "average",
    "needsWork",
    "horrible",
  ]).optional(),

  // General / Legacy fields (disposition to be fully decided)
  comments: z.string().optional(), // General comments, where should they be saved?
  points: z.number().min(0).default(0), // Not currently saved
  detention: z.boolean().default(false), // Not currently saved
  // Fields to be deprecated if not already used elsewhere
  // revision_status: z.string().optional(), // Was this for Sabaq or Dhor? More specific fields exist now.
  // teacher_notes: z.string().optional(), // Covered by comments or specific notes in tables?
});

export type DailyActivityFormValues = z.infer<typeof DailyActivityFormSchema>;
