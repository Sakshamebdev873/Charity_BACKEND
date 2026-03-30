import { z } from "zod";

export const upsertConfigSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export type UpsertConfigInput = z.infer<typeof upsertConfigSchema>;