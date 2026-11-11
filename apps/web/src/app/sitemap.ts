import type { MetadataRoute } from "next";
import { env } from "@/env";
import { routing } from "@/i18n/routing";

/**
 * Static routes per locale. Add dynamic entries by fetching from the backend here.
 *
 * Builder pages (`/[locale]/[...slug]`) are left out on purpose: the public
 * API has no list endpoint, only `GET /api/v1/pages/{slug}`, so the sitemap
 * cannot discover them. Once the backend exposes a public list of published
 * slugs (say `GET /api/v1/pages` → `[{ slug, updated_at }]`), add the path to
 * `endpoints.page`, a `pageApi.listPublished()` call in `libs/services`, make
 * this function `async`, and push one entry per slug and locale with
 * `lastModified: updated_at` and the same `alternates.languages` shape as
 * below. Draft previews (`/preview/...`) never belong here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/examples", "/login", "/signup"];
  return routing.locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/${locale}${page}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${env.NEXT_PUBLIC_SITE_URL}/${l}${page}`])
        ),
      },
    }))
  );
}
