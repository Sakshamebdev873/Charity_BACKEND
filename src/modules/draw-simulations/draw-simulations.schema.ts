import { z } from "zod";

export const simulationQuerySchema = z.object({
  drawId: z.string().min(1),
});