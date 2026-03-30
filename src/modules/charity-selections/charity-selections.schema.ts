import { z } from "zod";

export const selectCharitySchema = z.object({
  charityId: z.string().min(1, "Charity ID is required"),
  contributionPercent: z.number().min(10, "Minimum contribution is 10%").max(100).default(10),
});

export type SelectCharityInput = z.infer<typeof selectCharitySchema>;