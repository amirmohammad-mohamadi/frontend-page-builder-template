/** A letter of a right-to-left script (Arabic, Hebrew, Syriac, Thaana); digits do not count. */
const RTL_LETTER =
  /(?=[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}])\p{L}/u;

/** The first letter of a text, which `dir="auto"` takes the direction from. */
const FIRST_LETTER = /\p{L}/u;

/**
 * The `dir` of an isolated text run: `"rtl"` when the text holds any
 * right-to-left letter, else `undefined` (leave `dir="auto"` to decide).
 * Unlike `dir="auto"`, a right-to-left sentence that starts with a Latin
 * word keeps its word order and punctuation.
 */
export function textDirection(text: string | null | undefined): "rtl" | undefined {
  return text && RTL_LETTER.test(text) ? "rtl" : undefined;
}

/**
 * The `dir` a `<bdi dir="auto">` needs on top of `auto`: `"rtl"` only for a
 * text that holds a right-to-left letter but starts with a left-to-right one,
 * the one case where `auto` picks the wrong direction. Every other text keeps
 * `auto` (`undefined`).
 */
export function isolateDirection(text: string | null | undefined): "rtl" | undefined {
  if (!textDirection(text)) return undefined;
  const first = FIRST_LETTER.exec(text ?? "")?.[0] ?? "";
  return RTL_LETTER.test(first) ? undefined : "rtl";
}

/** Whether a BCP 47 locale is written right to left (by its language subtag). */
export function isRtlLocale(locale: string): boolean {
  const language = locale.split(/[-_]/)[0].toLowerCase();
  return RTL_LANGUAGES.has(language);
}

const RTL_LANGUAGES = new Set(["ar", "fa", "he", "ur", "ps", "sd", "ug", "yi", "dv", "ku", "syr"]);
