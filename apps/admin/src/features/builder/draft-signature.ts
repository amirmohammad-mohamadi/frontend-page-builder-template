import type { PageContentDto } from "@dtos";

/**
 * `JSON.stringify` with object keys sorted at every depth, so two structurally
 * equal values always serialise to the same string. Arrays keep their order
 * (order is meaningful for components). Like `JSON.stringify`, `undefined`
 * and function values are dropped from objects and become `null` in arrays.
 *
 * @param value anything JSON-serialisable
 */
export const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const body = Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined && typeof record[key] !== "function")
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",");
  return `{${body}}`;
};

/**
 * The signature of a page draft: a stable string of what a save sends (the component tree,
 * the CSS rules and the compiled CSS). The signature recorded at the last save is compared
 * with the one read from the editor to show the unsaved-changes indicator and to decide
 * whether Publish saves first.
 *
 * @param draft the draft as `readDraft` builds it from the editor
 */
export const buildDraftSignature = (draft: PageContentDto | null | undefined): string =>
  stableStringify({
    components: draft?.components ?? [],
    styles: draft?.styles ?? [],
    css: draft?.css ?? "",
  });

/**
 * Whether the editor holds changes the backend has not got: no save was recorded yet, or the
 * current signature moved since the recorded one.
 *
 * @param currentSignature the signature of what the editor holds now
 * @param savedSignature the signature recorded at the last load or save
 */
export const isDraftChanged = (
  currentSignature: string,
  savedSignature: string | null | undefined
): boolean => savedSignature == null || savedSignature !== currentSignature;
