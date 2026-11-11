/**
 * Coercion helpers for stored attributes. GrapesJS stores every trait as a
 * string, so a checkbox arrives as `"true"` / `"false"`, a number as `"400"`
 * and a list as JSON text. Everything here is total: bad input degrades to
 * the fallback instead of throwing inside a rendered page.
 */

/** A checkbox value: `"true"` / `"false"` strings or real booleans; anything else is `fallback`. */
export function parseBool(value: unknown, fallback = false): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

/** A number value from a string or number; empty or non-finite input is `fallback`. */
export function parseNum(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * A string list from a JSON array (`["a","b"]`), a comma-separated string
 * (`a, b`; the Arabic comma `،` separates too) or a real array. Garbage gives `[]`.
 */
export function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // Not JSON after all: fall through to comma splitting.
    }
  }
  return trimmed
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** A JSON value typed by an author; `undefined` when absent or malformed. */
export function parseJson<T>(value: unknown): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

/** A trimmed string, or `undefined` for empty or non-string input. */
export function parseText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
