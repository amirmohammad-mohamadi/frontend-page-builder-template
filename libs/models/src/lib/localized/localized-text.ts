/** A text stored once per locale, keyed by locale code. */
export type LocalizedText = Record<string, string>;

/**
 * Picks the text for `locale`, else for `fallbackLocale`, else the first
 * non-empty translation, else an empty string. Blank strings never win: a
 * page titled only in English still shows that title on the Persian site.
 */
export function resolveLocalizedText(
  value: LocalizedText | null | undefined,
  locale: string,
  fallbackLocale?: string
): string {
  if (!value) return "";
  const own = value[locale]?.trim();
  if (own) return own;
  const fallback = fallbackLocale ? value[fallbackLocale]?.trim() : "";
  if (fallback) return fallback;
  return (
    Object.values(value)
      .find((text) => text?.trim())
      ?.trim() ?? ""
  );
}
