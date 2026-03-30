import { z } from "zod";

export const createSubscriptionSchema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
  charityId: z.string().min(1, "Charity selection is required"),
  charityPercentage: z.number().min(10, "Minimum charity contribution is 10%").max(100).default(10),
});

export const updateSubscriptionSchema = z.object({
  charityPercentage: z.number().min(10).max(100).optional(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;