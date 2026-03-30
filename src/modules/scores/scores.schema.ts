import { z } from "zod";

export const addScoreSchema = z.object({
  score: z.number().int().min(1, "Minimum score is 1").max(45, "Maximum score is 45"),
  playedOn: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
});

export const updateScoreSchema = z.object({
  score: z.number().int().min(1).max(45).optional(),
  playedOn: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
});

export type AddScoreInput = z.infer<typeof addScoreSchema>;
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>;