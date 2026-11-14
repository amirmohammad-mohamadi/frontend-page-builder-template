import type { Metadata } from "next";
import { BuilderPageLoader } from "@/features/builder/builder-page-loader";
import { TEXTS } from "@/texts";

export const metadata: Metadata = { title: TEXTS.builder.metaTitle };

/** The page builder for one page, by its id. */
export default async function BuilderRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuilderPageLoader id={id} />;
}
