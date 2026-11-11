import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="border-t">
      <div className="text-muted-foreground container mx-auto max-w-5xl px-4 py-6 text-sm">
        {t("footer.copyright", { year: new Date().getFullYear(), appName: t("common.appName") })}
      </div>
    </footer>
  );
}
