import type { FieldDef } from "./types";

/**
 * A visitor-facing text of a block as it is stored: a plain string (the
 * default-locale text, as hand-written seeds carry it) or a record keyed by
 * locale (`{ "en": "Hello", "fa": "سلام" }`). In the component JSON the record
 * is stored serialized, as the attribute's string value.
 */
export type TranslatableText = string | Record<string, string>;

/** The locale a plain-string text is read as when no default is given. */
export const FALLBACK_LOCALE = "en";

/** Render-time locale context, the part of a request the renderer knows. */
export type LocaleContext = {
  /** The locale being rendered. */
  locale: string;
  /** The locale a missing translation falls back to; also the one a plain string is in. */
  defaultLocale?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The string values of a parsed record, in order; non-string entries are dropped. */
function stringEntries(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * Parses a stored text into its locale record. A plain string (or a string
 * that is not a JSON object) is the `defaultLocale` text; a JSON object string
 * or a record is read as is. Anything else gives `{}`.
 *
 * @param value the stored attribute value
 * @param defaultLocale the locale a plain string is in (`"en"` when omitted)
 */
export function parseTranslatable(
  value: unknown,
  defaultLocale = FALLBACK_LOCALE
): Record<string, string> {
  if (isRecord(value)) return stringEntries(value);
  if (typeof value !== "string") return {};
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isRecord(parsed)) return stringEntries(parsed);
    } catch {
      // Not a locale record: a plain text that happens to use braces.
    }
  }
  return value === "" ? {} : { [defaultLocale]: value };
}

/**
 * The text to show for `locale`: the exact locale, then its language subtag
 * (`fa` for `fa-IR`), then `defaultLocale`, then the first text there is. A
 * plain string serves every locale. Empty when nothing is stored.
 *
 * @param value the stored attribute value (plain string, JSON string or record)
 * @param locale the locale being rendered
 * @param defaultLocale the locale a missing translation falls back to
 */
export function resolveTranslatable(
  value: unknown,
  locale: string,
  defaultLocale = FALLBACK_LOCALE
): string {
  const record = parseTranslatable(value, defaultLocale);
  const keys = Object.keys(record);
  if (keys.length === 0) return "";
  const candidates = [
    locale,
    locale.split(/[-_]/)[0],
    defaultLocale,
    defaultLocale.split(/[-_]/)[0],
  ];
  for (const key of candidates) {
    const text = record[key];
    if (typeof text === "string" && text !== "") return text;
  }
  return keys.map((key) => record[key]).find((text) => text !== "") ?? "";
}

/**
 * Serializes a locale record into the attribute string the page stores. Empty
 * texts are dropped; an empty record gives `""`.
 *
 * @param record texts keyed by locale
 */
export function serializeTranslatable(record: Record<string, string>): string {
  const kept: Record<string, string> = {};
  for (const [key, text] of Object.entries(record)) {
    if (typeof text === "string" && text !== "") kept[key] = text;
  }
  return Object.keys(kept).length === 0 ? "" : JSON.stringify(kept);
}

/**
 * The stored value with the text of one locale replaced: parses `value`, sets
 * `locale` to `text` (an empty text removes the locale) and serializes again.
 * A plain-string input is kept as the `defaultLocale` text.
 *
 * @param value the stored attribute value
 * @param locale the locale to write
 * @param text the new text for that locale
 * @param defaultLocale the locale a plain-string `value` is in
 */
export function setTranslation(
  value: unknown,
  locale: string,
  text: string,
  defaultLocale = FALLBACK_LOCALE
): string {
  const record = parseTranslatable(value, defaultLocale);
  if (text === "") delete record[locale];
  else record[locale] = text;
  return serializeTranslatable(record);
}

/**
 * The names of the translatable fields in a field list.
 *
 * @param fields a block's field definitions
 */
export function translatableFieldNames(fields: readonly FieldDef[]): string[] {
  return fields.filter((field) => field.translatable).map((field) => field.name);
}
