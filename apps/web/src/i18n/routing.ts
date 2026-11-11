import { defineRouting } from "next-intl/routing";
import { env } from "@/env";
import { LOCALES } from "./locales";

/** How long the locale cookie keeps the visitor's language: one year. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: env.NEXT_PUBLIC_DEFAULT_LOCALE,
  localePrefix: "always",
  localeCookie: { maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS },
});
