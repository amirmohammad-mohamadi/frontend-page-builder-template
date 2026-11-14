/** The admin app is single-language; dates and numbers format with this tag everywhere. */
export const ADMIN_LOCALE = "en-GB";

/**
 * The locales a page's content is written in: the page builder edits one text per
 * locale and the pages table shows a title per locale. Must match the web app's
 * `apps/web/src/i18n/locales.ts` (`LOCALES`), which is the list the web app
 * renders and the editor's Preview opens.
 */
export const CONTENT_LOCALES = ["en", "fa"] as const;

export type ContentLocale = (typeof CONTENT_LOCALES)[number];

/** The locale a missing translation falls back to; matches the web app's default. */
export const DEFAULT_CONTENT_LOCALE: ContentLocale = "en";

/** Native-language labels for the editing-locale switcher. */
export const CONTENT_LOCALE_LABELS: Record<ContentLocale, string> = {
  en: "English",
  fa: "فارسی",
};

export function isContentLocale(value: unknown): value is ContentLocale {
  return typeof value === "string" && (CONTENT_LOCALES as readonly string[]).includes(value);
}
