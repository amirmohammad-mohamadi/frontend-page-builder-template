"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@components";
import { captureError } from "@utils";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");

  useEffect(() => {
    captureError(error, { boundary: "locale" });
  }, [error]);

  return (
    <div className="container mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2">{t("description")}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>{common("retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
