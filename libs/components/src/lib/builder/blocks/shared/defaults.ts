import { serializeTranslatable } from "../../fields/translatable";
import type { FieldSelectOption } from "../../fields/types";

/**
 * A translatable default with its English and Persian sample texts, serialized
 * as the attribute string a fresh block starts with.
 *
 * @param en the English sample
 * @param fa the Persian sample
 */
export function sample(en: string, fa: string): string {
  return serializeTranslatable({ en, fa });
}

/**
 * Select options from `[id, label]` pairs.
 *
 * @param pairs the option ids and labels
 */
export function options(pairs: readonly (readonly [string, string])[]): FieldSelectOption[] {
  return pairs.map(([id, label]) => ({ id, label }));
}

/** The alignment choices text blocks share (logical: start and end flip in RTL). */
export const ALIGN_OPTIONS = options([
  ["start", "Start"],
  ["center", "Center"],
  ["end", "End"],
]);

/** The text alignment class of an `align` value. */
export const ALIGN_CLASSES: Readonly<Record<string, string>> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};
