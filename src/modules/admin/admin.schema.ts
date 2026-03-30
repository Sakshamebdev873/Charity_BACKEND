import { z } from "zod";

export const adminQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});