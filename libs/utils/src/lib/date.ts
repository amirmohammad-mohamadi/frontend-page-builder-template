/** What `formatDate` writes when the caller names no fields, e.g. "31 Oct 2026". */
export const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat(locale, options);
    } catch {
      formatter = new Intl.DateTimeFormat("en", options);
    }
    formatterCache.set(key, formatter);
  }
  return formatter;
}

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date through `Intl.DateTimeFormat` for `locale`. The calendar,
 * numbering system and time zone come from the locale tag and `options`
 * (`fa-IR-u-ca-persian`, `{ timeZone: "UTC" }`), so no locale is special-cased
 * here. Empty or invalid input gives an empty string.
 */
export function formatDate(
  value: Date | string | number | null | undefined,
  locale = "en",
  options: Intl.DateTimeFormatOptions = DEFAULT_DATE_OPTIONS
): string {
  const date = toDate(value);
  return date ? getFormatter(locale, options).format(date) : "";
}

/** Short date plus hours and minutes, e.g. "09/11/2026, 13:19" on `en-GB`. Empty string for invalid input. */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  locale = "en",
  options: Pick<Intl.DateTimeFormatOptions, "timeZone"> = {}
): string {
  return formatDate(value, locale, { dateStyle: "short", timeStyle: "short", ...options });
}

/**
 * A relative time such as "3 days ago" or "in 2 hours", in the locale's
 * wording. Picks the largest unit whose magnitude is at least one.
 */
export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  locale = "en",
  now: Date = new Date()
): string {
  const date = toDate(value);
  if (!date) return "";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  const [unit, size] = units.find(([, s]) => Math.abs(seconds) >= s) ?? ["second", 1];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return formatter.format(Math.round(seconds / size), unit);
}
