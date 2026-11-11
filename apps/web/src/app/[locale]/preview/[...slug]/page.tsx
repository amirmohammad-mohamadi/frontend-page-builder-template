import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PagePreview } from "@/features/pages/page-preview";

type Props = { params: Promise<{ locale: string; slug: string[] }> };

/** Never indexed: a draft is work in progress, visible to signed-in operators only. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages" });
  return { title: t("previewTitle"), robots: { index: false, follow: false } };
}

/**
 * The draft of a builder page, for an operator. `proxy.ts` sends a signed-out
 * visitor to the sign-in page (`PROTECTED_PATHS`); the client feature reads the
 * draft through the BFF proxy, which adds the session token.
 */
export default async function PreviewPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  return <PagePreview slugSegments={slug} />;
}
