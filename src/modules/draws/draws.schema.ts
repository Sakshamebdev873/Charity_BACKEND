import { z } from "zod";

export const createDrawSchema = z.object({
  drawDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  monthYear: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
  type: z.enum(["RANDOM", "ALGORITHMIC"]).default("RANDOM"),
});

export const updateDrawSchema = z.object({
  type: z.enum(["RANDOM", "ALGORITHMIC"]).optional(),
  drawDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").optional(),
  status: z.enum(["SCHEDULED", "SIMULATED", "PUBLISHED", "CANCELLED"]).optional(),
});

export type CreateDrawInput = z.infer<typeof createDrawSchema>;
export type UpdateDrawInput = z.infer<typeof updateDrawSchema>;