
import { z } from "zod";

export interface ProgressRecordingProps {
  teacherId: string;
}

export const progressFormSchema = z.object({
  student_id: z.string({
    required_error: "Please select a student"
  }),
  current_surah: z.coerce.number().min(1).max(114),
  current_juz: z.coerce.number().min(1).max(30),
  start_ayat: z.coerce.number().min(1),
  end_ayat: z.coerce.number().min(1),
  memorization_quality: z.enum(["excellent", "good", "average", "needsWork", "horrible"]),
  tajweed_level: z.string().min(1, "Tajweed level is required"),
  notes: z.string().optional()
});

export type ProgressFormValues = z.infer<typeof progressFormSchema>;

export interface ContributorInfo {
  contributor_id: string;
  contributor_name: string;
}
