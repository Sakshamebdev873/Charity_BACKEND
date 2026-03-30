import { z } from "zod";

export const enterDrawSchema = z.object({
  drawId: z.string().min(1, "Draw ID is required"),
});

export type EnterDrawInput = z.infer<typeof enterDrawSchema>;