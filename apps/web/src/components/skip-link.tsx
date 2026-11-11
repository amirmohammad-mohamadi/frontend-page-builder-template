import { useTranslations } from "next-intl";

/** Keyboard users jump past the header; visible only while focused. */
export function SkipLink() {
  const t = useTranslations("common");
  return (
    <a
      href="#main"
      className="bg-primary text-primary-foreground focus:not-sr-only sr-only fixed top-2 start-2 z-50 rounded-md px-3 py-2 text-sm"
    >
      {t("skipToContent")}
    </a>
  );
}
