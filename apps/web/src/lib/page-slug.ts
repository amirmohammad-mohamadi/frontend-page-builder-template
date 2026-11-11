import { pageSlugSchema } from "@dtos";

/**
 * The trailing path segment the backend reserves for the draft preview route
 * (`GET /api/v1/pages/{slug}/preview`), so no page slug may end in it. See
 * `docs/pages-api.md`.
 */
export const RESERVED_LAST_SEGMENT = "preview";

/**
 * Joins the catch-all segments of a URL into the page slug the backend stores
 * (`["help", "getting-started"]` → `"help/getting-started"`), or returns `null`
 * when they cannot be a slug: empty, refused by the DTO's `pageSlugSchema`
 * (lowercase `a-z0-9`, `-` and `/`, at most 200 characters), or ending in the
 * reserved `preview` segment. A `null` means "no such page", never a request.
 *
 * @param segments the already-decoded `[...slug]` route params
 */
export function toPageSlug(segments: readonly string[] | undefined): string | null {
  if (!segments || segments.length === 0) return null;
  const slug = segments.join("/");
  const parsed = pageSlugSchema.safeParse(slug);
  // The schema trims; a slug that only passes once trimmed is not this URL's slug.
  if (!parsed.success || parsed.data !== slug) return null;
  if (segments[segments.length - 1] === RESERVED_LAST_SEGMENT) return null;
  return slug;
}

/**
 * The public URL path of a page slug, without the locale (`"/help/getting-started"`).
 * The locale-aware `Link` adds the locale prefix.
 */
export function publishedPagePath(slug: string): string {
  return `/${slug}`;
}
