import type { Metadata } from "next";
import { MediaLibrary } from "@/features/media/media-library";
import { TEXTS } from "@/texts";

export const metadata: Metadata = { title: TEXTS.media.title };

export default function MediaPage() {
  return <MediaLibrary />;
}
