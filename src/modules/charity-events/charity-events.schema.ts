import { z } from "zod";

export const createCharityEventSchema = z.object({
  charityId: z.string().min(1),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  location: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const updateCharityEventSchema = createCharityEventSchema.partial();

export type CreateCharityEventInput = z.infer<typeof createCharityEventSchema>;
export type UpdateCharityEventInput = z.infer<typeof updateCharityEventSchema>;