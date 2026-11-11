import { useTranslations } from "next-intl";
import { Button } from "@components";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <div className="container mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-muted-foreground text-sm">404</p>
      <h1 className="mt-1 text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground mt-2">{t("notFoundDescription")}</p>
      <Button className="mt-6" asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
