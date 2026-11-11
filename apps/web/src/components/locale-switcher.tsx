"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components";
import { switchLocaleInPath } from "@utils";
import { LOCALE_LABELS, LOCALES } from "@/i18n/locales";

/**
 * Switches the locale segment of the current URL (query and hash kept); the
 * locale cookie follows through next-intl's middleware on the next request.
 */
export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (code: string) => {
    const { search, hash } = window.location;
    router.replace(`${switchLocaleInPath(pathname, code, LOCALES)}${search}${hash}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language")}>
          <LanguagesIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((code) => (
          <DropdownMenuItem key={code} disabled={code === locale} onSelect={() => switchTo(code)}>
            {LOCALE_LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
