import { isRtlLocale } from "@utils";

/**
 * The locales this app serves. Adding one is three steps: add the code here,
 * add `messages/<code>.json`, and (if the backend is localised) make sure it
 * accepts the code. Nothing else in the app names a locale. The default
 * locale comes from `NEXT_PUBLIC_DEFAULT_LOCALE` through `env.ts`.
 */
export const LOCALES = ["en", "fa"] as const;

export type AppLocale = (typeof LOCALES)[number];

/** Native-language labels for the locale switcher. */
export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  fa: "فارسی",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** `"rtl"` or `"ltr"` for `<html dir>`, decided by the language, not by a list kept here. */
export function localeDirection(locale: string): "rtl" | "ltr" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}
