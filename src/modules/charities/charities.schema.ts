import { z } from "zod";

export const createCharitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().min(1, "Description is required"),
  logoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
});

export const updateCharitySchema = createCharitySchema.partial();

export type CreateCharityInput = z.infer<typeof createCharitySchema>;
export type UpdateCharityInput = z.infer<typeof updateCharitySchema>;