"use client";

import { useTranslations } from "next-intl";
import { Badge, Button, Skeleton } from "@components";
import { renderPageContent } from "@components/builder";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { usePagePreviewPage } from "./page-preview.hook";

/**
 * The draft preview an operator sees: a sticky banner that says the page is
 * not public, with a link to the published URL and the locale switcher, then
 * the draft rendered exactly as the public route renders the published copy.
 */
export function PagePreview({ slugSegments }: { slugSegments: string[] }) {
  const t = useTranslations("pages");
  const common = useTranslations("common");
  const { state, page, locale, defaultLocale, publishedHref, signInHref, retry } =
    usePagePreviewPage(slugSegments);

  return (
    <div className="flex flex-col">
      <div
        role="status"
        data-preview-banner
        className="bg-muted text-foreground sticky top-0 z-40 border-b"
      >
        <div className="container mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2 text-sm">
          <Badge variant="secondary">{t("draftBadge")}</Badge>
          <span className="font-medium">{t("previewBanner")}</span>
          {page ? (
            <span className="text-muted-foreground truncate">
              {page.getTitle(locale, defaultLocale)}
            </span>
          ) : null}
          <div className="ms-auto flex items-center gap-1">
            <Button variant="link" size="sm" asChild>
              <Link href={publishedHref}>{t("previewOpenPublished")}</Link>
            </Button>
            <LocaleSwitcher />
          </div>
        </div>
      </div>

      {state === "loading" ? (
        <div className="container mx-auto max-w-5xl space-y-4 px-4 py-10" aria-busy="true">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : state === "unauthorized" ? (
        <div role="alert" className="container mx-auto max-w-xl px-4 py-20 text-center">
          <p>{t("previewSignIn")}</p>
          <Button className="mt-4" asChild>
            <Link href={signInHref}>{t("previewSignInAction")}</Link>
          </Button>
        </div>
      ) : state === "not-found" ? (
        <div role="alert" className="container mx-auto max-w-xl px-4 py-20 text-center">
          <p className="text-muted-foreground text-sm">404</p>
          <p className="mt-1">{t("notFound")}</p>
        </div>
      ) : state === "error" ? (
        <div role="alert" className="container mx-auto max-w-xl px-4 py-20 text-center">
          <p>{t("loadError")}</p>
          <Button variant="outline" className="mt-4" onClick={retry}>
            {common("retry")}
          </Button>
        </div>
      ) : state === "empty" || !page ? (
        <p className="text-muted-foreground container mx-auto max-w-3xl px-4 py-20 text-center">
          {t("empty")}
        </p>
      ) : (
        <article data-page-slug={page.getSlug()} className="flex flex-col">
          {renderPageContent(page.getDraft(), { locale, defaultLocale })}
        </article>
      )}
    </div>
  );
}
