import { cache } from "react";
import { PageModel } from "@models";
import { ApiClientError, pageApi } from "@services";
// The transport must be installed in the module graph that makes the call.
// `instrumentation.ts` installs it for the server start and `providers.tsx`
// for the client, but the React Server Components graph is bundled on its own
// and gets neither, so a server-side `pageApi` call would otherwise fetch a
// bare `/api/v1/...` path. Importing the (idempotent) setup here makes this
// module self-sufficient.
import "@/lib/api-client-setup";
import { toPageSlug } from "./page-slug";

/**
 * The outcome of looking a published page up by its URL. A 404 (unknown slug,
 * or a page that is not published) is an answer, not a failure, so the route
 * can render its not-found page; any other failure (a 5xx, the network, a
 * timeout) is returned as `error` for the route to throw into `error.tsx`.
 */
export type PublishedPageResolution =
  | { status: "ok"; page: PageModel }
  | { status: "not-found" }
  | { status: "error"; error: ApiClientError };

/** HTTP answers that mean "there is no such page here": missing, or gone for good. */
const MISSING_STATUS_CODES = new Set([404, 410]);

/**
 * `resolvePublishedPage` without the request cache, exported for the unit
 * tests. Validates the slug first (an invalid slug never reaches the backend),
 * then calls the public read; a page that comes back without a published copy
 * counts as not found, so a backend that answers the record regardless of its
 * status still never exposes a draft.
 *
 * @param slugSegments the `[...slug]` route params
 */
export async function resolvePublishedPageUncached(
  slugSegments: readonly string[]
): Promise<PublishedPageResolution> {
  const slug = toPageSlug(slugSegments);
  if (!slug) return { status: "not-found" };

  try {
    const page = new PageModel(await pageApi.getBySlug(slug));
    if (!page.isPublished() || !page.getPublished()) return { status: "not-found" };
    return { status: "ok", page };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (MISSING_STATUS_CODES.has(error.statusCode)) return { status: "not-found" };
      return { status: "error", error };
    }
    throw error;
  }
}

/**
 * Resolves the catch-all route's segments to the published page to render.
 * Wrapped in React's `cache()` so `generateMetadata` and the page component,
 * which both need the page in the same render pass, share one backend call.
 *
 * @param slugSegments the `[...slug]` route params
 */
export const resolvePublishedPage = cache(resolvePublishedPageUncached);
