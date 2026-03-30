import { z } from "zod";

export const createDonationSchema = z.object({
  charityId: z.string().min(1, "Charity ID is required"),
  amountInCents: z.number().int().min(100, "Minimum donation is £1.00"),
  currency: z.string().default("GBP"),
});

export type CreateDonationInput = z.infer<typeof createDonationSchema>;