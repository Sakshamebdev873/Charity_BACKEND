import { z } from "zod";

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  country: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  timezone: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;