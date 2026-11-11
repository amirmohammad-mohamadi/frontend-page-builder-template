import type { MetadataRoute } from "next";
import { env } from "@/env";
import { routing } from "@/i18n/routing";

/** Static routes per locale. Add dynamic entries by fetching from the backend here. */
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
