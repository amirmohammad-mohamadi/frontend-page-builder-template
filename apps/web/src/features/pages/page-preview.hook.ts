"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { usePagePreview } from "@services";
import { routing } from "@/i18n/routing";
import { publishedPagePath, toPageSlug } from "@/lib/page-slug";

/** What the preview screen shows: one state at a time. */
export type PagePreviewState =
  "loading" | "unauthorized" | "not-found" | "error" | "empty" | "ready";

/**
 * The feature hook of the draft preview: turns the route's segments into the
 * slug, reads the draft through `usePagePreview` (the BFF proxy adds the
 * session) and reduces the query to the state the component renders. An
 * invalid slug is "not found" without a request.
 */
export function usePagePreviewPage(slugSegments: string[]) {
  const locale = useLocale();
  const pathname = usePathname();
  const slug = toPageSlug(slugSegments);
  const query = usePagePreview(slug ?? undefined);
  const page = query.data;

  let state: PagePreviewState;
  if (!slug) state = "not-found";
  else if (query.isPending) state = "loading";
  else if (query.isError) {
    const status = query.error.statusCode;
    state =
      status === 401 || status === 403
        ? "unauthorized"
        : status === 404 || status === 410
          ? "not-found"
          : "error";
  } else if (!page || page.getDraft().components.length === 0) state = "empty";
  else state = "ready";

  return {
    state,
    page,
    locale,
    defaultLocale: routing.defaultLocale,
    /** The public URL of the page (without the locale; `Link` adds it). */
    publishedHref: slug ? publishedPagePath(slug) : "/",
    /** The sign-in URL that comes back to this preview; `pathname` already carries the locale. */
    signInHref: `/login?next=${encodeURIComponent(pathname)}`,
    retry: () => query.refetch(),
  };
}
