const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${options ? JSON.stringify(options) : ""}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, options);
    } catch {
      formatter = new Intl.NumberFormat("en", options);
    }
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Formats a number for `locale` through a cached `Intl.NumberFormat`. Digits
 * and separators follow the locale (or an explicit `-u-nu-` extension in the
 * tag). Non-finite input gives an empty string so callers can show a
 * placeholder instead of "NaN".
 */
export function formatNumber(
  value: number | string,
  locale = "en",
  options?: Intl.NumberFormatOptions
): string {
  const numeric = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(numeric)) return "";
  return getFormatter(locale, options).format(numeric);
}

/** A positional index with no grouping and an optional zero pad ("01", "02"). */
export function formatIndex(value: number, locale = "en", minimumIntegerDigits = 1): string {
  return formatNumber(value, locale, { useGrouping: false, minimumIntegerDigits });
}

/**
 * Formats an amount of money for `locale` in ISO `currency`. The amount is a
 * number in major units; backends that send minor units or strings convert
 * before calling. `currencyDisplay` defaults to the locale's symbol.
 */
export function formatMoney(
  amount: number | string,
  locale: string,
  currency: string,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">
): string {
  return formatNumber(amount, locale, { style: "currency", currency, ...options });
}

/** A fraction between 0 and 1 as a percentage, e.g. 0.256 → "26%". */
export function formatPercent(fraction: number, locale = "en", maximumFractionDigits = 0): string {
  return formatNumber(fraction, locale, { style: "percent", maximumFractionDigits });
}

/** A byte count in the nearest unit, e.g. "1.5 MB". */
export function formatFileSize(bytes: number, locale = "en"): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"] as const;
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return formatNumber(value, locale, {
    style: "unit",
    unit: units[index],
    unitDisplay: "short",
    maximumFractionDigits: index === 0 ? 0 : 1,
  });
}
