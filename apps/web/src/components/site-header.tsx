import { useTranslations } from "next-intl";
import { Logo } from "@assets";
import { ThemeToggle } from "@components";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  const t = useTranslations();
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="size-6" />
          {t("common.appName")}
        </Link>
        <nav className="hidden items-center gap-4 text-sm sm:flex" aria-label="Main">
          {/* example-domain:start */}
          <Link href="/examples" className="text-muted-foreground hover:text-foreground">
            {t("nav.examples")}
          </Link>
          {/* example-domain:end */}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle
            labels={{
              theme: t("common.theme"),
              light: t("common.themeLight"),
              dark: t("common.themeDark"),
              system: t("common.themeSystem"),
            }}
          />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
