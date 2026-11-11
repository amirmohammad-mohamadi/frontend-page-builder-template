import { z } from "zod";
import { localizedTextSchema, requiredLocalizedTextSchema } from "../shared/localized-text.dto";
import { listQuerySchema } from "../shared/pagination.dto";

/** Lowercase segments of `a-z0-9` joined by `-` or `/`: `about`, `help/getting-started`. */
export const PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

export const pageSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(PAGE_SLUG_PATTERN, "Use lowercase letters, digits, dashes and slashes");

export const pageStatusSchema = z.enum(["draft", "published"]);

export type PageStatusDto = z.infer<typeof pageStatusSchema>;

/**
 * What the editor saves and the web app renders: the GrapesJS component JSON
 * tree (the root's children), the GrapesJS CssRule JSON, and optionally the
 * CSS string the editor compiled from those rules.
 */
export const pageContentSchema = z.object({
  components: z.array(z.unknown()),
  styles: z.array(z.unknown()),
  css: z.string().optional(),
});

export type PageContentDto = z.infer<typeof pageContentSchema>;

export const pageSeoSchema = z.object({
  description: localizedTextSchema.optional(),
  image: z.string().nullable().optional(),
});

export type PageSeoDto = z.infer<typeof pageSeoSchema>;

/**
 * A builder page. `draft` is what the editor edits; `published` is the copy the
 * public app renders, set by the publish endpoint and cleared by unpublish.
 */
export const pageSchema = z.object({
  id: z.union([z.number(), z.string()]),
  slug: z.string(),
  status: pageStatusSchema,
  title: localizedTextSchema,
  seo: pageSeoSchema.nullable().optional(),
  draft: pageContentSchema,
  published: pageContentSchema.nullable(),
  published_at: z.string().nullable(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type PageDto = z.infer<typeof pageSchema>;

export const createPageSchema = z.object({
  slug: pageSlugSchema,
  title: requiredLocalizedTextSchema,
});

export type CreatePageDto = z.infer<typeof createPageSchema>;

export const updatePageSchema = z.object({
  slug: pageSlugSchema.optional(),
  title: requiredLocalizedTextSchema.optional(),
  seo: pageSeoSchema.optional(),
  draft: pageContentSchema.optional(),
});

export type UpdatePageDto = z.infer<typeof updatePageSchema>;

export const listPagesQuerySchema = listQuerySchema.extend({
  status: pageStatusSchema.optional(),
});

export type ListPagesQueryDto = z.infer<typeof listPagesQuerySchema>;
