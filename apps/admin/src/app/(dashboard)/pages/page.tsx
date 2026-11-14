import type { Metadata } from "next";
import { PagesTable } from "@/features/pages/pages-table";
import { TEXTS } from "@/texts";

export const metadata: Metadata = { title: TEXTS.pages.title };

export default function PagesPage() {
  return <PagesTable />;
}
