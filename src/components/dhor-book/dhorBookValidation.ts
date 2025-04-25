
import * as z from "zod";

export const DhorBookEntrySchema = z.object({
  entry_date: z.date(),
  sabak: z.string().optional(),
  sabak_para: z.string().optional(),
  dhor_1: z.string().optional(),
  dhor_1_mistakes: z.number().int().min(0).default(0),
  dhor_2: z.string().optional(),
  dhor_2_mistakes: z.number().int().min(0).default(0),
  comments: z.string().optional(),
  points: z.number().int().min(0).default(0),
  detention: z.boolean().default(false)
});
