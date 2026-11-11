import { z } from "zod";
import { localizedTextSchema } from "../shared/localized-text.dto";
import { listQuerySchema } from "../shared/pagination.dto";

/** An uploaded file as the media library lists it. `width`/`height` are set for images the backend could measure. */
export const mediaAssetSchema = z.object({
  id: z.union([z.number(), z.string()]),
  url: z.string(),
  name: z.string(),
  mime: z.string(),
  size: z.number().int().nonnegative(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  alt: localizedTextSchema,
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type MediaAssetDto = z.infer<typeof mediaAssetSchema>;

export const updateMediaAssetSchema = z.object({
  alt: localizedTextSchema.optional(),
  name: z.string().trim().min(1).max(200).optional(),
});

export type UpdateMediaAssetDto = z.infer<typeof updateMediaAssetSchema>;

/** The media list is paginated and searched by name; it has no extra filters. */
export const listMediaQuerySchema = listQuerySchema;

export type ListMediaQueryDto = z.infer<typeof listMediaQuerySchema>;
