import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { renderPageContent } from "@components/builder";
import { routing } from "@/i18n/routing";
import { resolvePublishedPage } from "@/lib/page-resolver";
import { publishedPagePath, toPageSlug } from "@/lib/page-slug";

/**
 * Rendered on every request, never at build time. A published page changes
 * whenever an operator publishes or unpublishes it, and there is no list
 * endpoint to pre-generate from, so a build cannot know the pages; rendering
 * on demand shows a new publish at once and drops an unpublished page at
 * once, for the price of one public backend read per request (the metadata
 * and the body share it through `cache()`). A project that would rather
 * trade freshness for fewer reads replaces this line with
 * `export const revalidate = 60;` and accepts a one-minute window.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; slug: string[] }> };

/**
 * Catch-all for the pages the builder publishes (`/en/about`,
 * `/fa/help/getting-started`). Static routes (`/examples`, `/account`,
 * `/login`, `/preview/...`) win over this segment in Next.js, so a slug can
 * never shadow a coded page; the resolver's slug validation keeps odd paths
 * from ever reaching the backend.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolution = await resolvePublishedPage(slug);
  // The body decides not-found and errors; metadata just stays empty then.
  if (resolution.status !== "ok") return {};

  const { page } = resolution;
  const defaultLocale = routing.defaultLocale;
  const path = publishedPagePath(page.getSlug());
  const title = page.getTitle(locale, defaultLocale) || undefined;
  const description = page.getSeoDescription(locale, defaultLocale) || undefined;
  const image = page.getSeoImage();

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}${path}`])),
    },
    openGraph: {
      type: "website",
      title,
      description,
      locale,
      url: `/${locale}${path}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function BuilderPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const resolution = await resolvePublishedPage(slug);
  if (resolution.status === "not-found") notFound();
  // A 5xx or a network failure reaches `[locale]/error.tsx`, which offers a retry.
  if (resolution.status === "error") throw resolution.error;

  const { page } = resolution;
  const content = page.getPublished();
  const slugAttribute = toPageSlug(slug) ?? page.getSlug();

  if (!content || content.components.length === 0) {
    const t = await getTranslations({ locale, namespace: "pages" });
    return (
      <article data-page-slug={slugAttribute} className="container mx-auto max-w-3xl px-4 py-20">
        <p className="text-muted-foreground text-center">{t("empty")}</p>
      </article>
    );
  }

  return (
    <article data-page-slug={slugAttribute} className="flex flex-col">
      {renderPageContent(content, {
        locale,
        defaultLocale: routing.defaultLocale,
      })}
    </article>
  );
}
