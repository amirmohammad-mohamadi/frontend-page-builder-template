import { z } from "zod";

/**
 * A text stored once per locale, keyed by locale code (`{ en: "About", fa: "درباره" }`).
 * Models resolve it with `resolveLocalizedText`, falling back to the default locale.
 */
export const localizedTextSchema = z.record(z.string(), z.string());

export type LocalizedTextDto = z.infer<typeof localizedTextSchema>;

/** A localized text with at least one non-empty translation, for create forms. */
export const requiredLocalizedTextSchema = localizedTextSchema.refine(
  (value) => Object.values(value).some((text) => text.trim().length > 0),
  { message: "A value in at least one language is required" }
);
