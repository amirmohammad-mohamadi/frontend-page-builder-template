import { setRequestLocale } from "next-intl/server";
import { ExampleDetail } from "@/features/examples/example-detail";

export default async function ExamplePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  return <ExampleDetail id={id} />;
}
