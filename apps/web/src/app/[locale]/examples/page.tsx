import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExamplesList } from "@/features/examples/examples-list";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "examples" });
  return { title: t("title") };
}

export default async function ExamplesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ExamplesList />;
}
