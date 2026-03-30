import { z } from "zod";

export const uploadProofSchema = z.object({
  proofImageUrl: z.string().url("Invalid image URL"),
});

export const verifyWinnerSchema = z.object({
  verificationStatus: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().optional(),
});

export const updatePayoutSchema = z.object({
  payoutStatus: z.enum(["PENDING", "PAID", "FAILED"]),
});

export type UploadProofInput = z.infer<typeof uploadProofSchema>;
export type VerifyWinnerInput = z.infer<typeof verifyWinnerSchema>;
export type UpdatePayoutInput = z.infer<typeof updatePayoutSchema>;