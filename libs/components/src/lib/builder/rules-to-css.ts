/**
 * A stored GrapesJS CSS rule (`styles` of a page), as the editor serializes it.
 * Only the keys the conversion reads are typed.
 */
export type CssRuleJSON = {
  selectors?: (string | { name?: string; type?: number })[];
  selectorsAdd?: string;
  state?: string;
  mediaText?: string;
  atRuleType?: string;
  style?: Record<string, string>;
  important?: boolean;
  [key: string]: unknown;
};

/** GrapesJS's selector type for an id selector; a class is the default. */
const ID_SELECTOR_TYPE = 2;

function selectorText(selector: string | { name?: string; type?: number }): string {
  if (typeof selector === "string") {
    return /^[.#]/.test(selector) ? selector : `.${selector}`;
  }
  if (!selector.name) return "";
  return `${selector.type === ID_SELECTOR_TYPE ? "#" : "."}${selector.name}`;
}

/**
 * The CSS text of stored GrapesJS rules, for a page saved without a compiled
 * `css` string. Rules without a selector or without declarations are skipped;
 * the result still goes through `sanitizeCss` before it reaches a `<style>`.
 *
 * @param rules the page's `styles`
 */
export function rulesToCss(rules: unknown): string {
  if (!Array.isArray(rules)) return "";
  const out: string[] = [];

  for (const entry of rules as unknown[]) {
    if (!entry || typeof entry !== "object") continue;
    const rule = entry as CssRuleJSON;
    const style = rule.style ?? {};
    const declarations = Object.entries(style)
      .filter(([, value]) => typeof value === "string" && value !== "")
      .map(([property, value]) => `${property}:${value}${rule.important ? " !important" : ""};`)
      .join("");
    if (!declarations) continue;

    const compound = (rule.selectors ?? []).map(selectorText).filter(Boolean).join("");
    const selector = [compound, rule.selectorsAdd].filter(Boolean).join(", ");
    if (!selector) continue;
    const state = rule.state ? `:${rule.state}` : "";
    const text = `${selector}${state}{${declarations}}`;

    out.push(rule.mediaText ? `@${rule.atRuleType || "media"} ${rule.mediaText}{${text}}` : text);
  }

  return out.join("\n");
}
