import type { CSSProperties } from "react";
import { safeUrl } from "./sanitize/sanitize-html";

/** Tags a stored node may not render as: they would run or load something on the visitor's page. */
const UNSAFE_TAGS: ReadonlySet<string> = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "template",
  "noscript",
  "html",
  "head",
  "body",
]);

/**
 * The stored tag when it is a plain, safe HTML tag name, otherwise `fallback`.
 *
 * @param tagName the stored `tagName`
 * @param fallback the element to use instead (`div`, `span`, …)
 */
export function safeTagName(tagName: unknown, fallback: string): string {
  if (typeof tagName !== "string") return fallback;
  const tag = tagName.toLowerCase();
  return /^[a-z][a-z0-9-]*$/.test(tag) && !UNSAFE_TAGS.has(tag) ? tag : fallback;
}

/** Elements that never take children. */
export const VOID_TAGS: ReadonlySet<string> = new Set([
  "area",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "source",
  "track",
  "wbr",
]);

/**
 * The class names of a stored node. GrapesJS stores a private selector as
 * `{ name, private: true }`, not as a string; joining those as-is wrote
 * `class="[object Object]"`.
 *
 * @param classes the stored `classes`
 */
export function toClassNames(classes: unknown): string[] {
  if (!Array.isArray(classes)) return [];
  return classes
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : entry &&
            typeof entry === "object" &&
            typeof (entry as { name?: unknown }).name === "string"
          ? (entry as { name: string }).name
          : ""
    )
    .filter(Boolean);
}

/** Stored attributes a plain node may carry onto its element, by their HTML name. */
const SAFE_ATTRIBUTES: ReadonlySet<string> = new Set([
  "id",
  "title",
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "width",
  "height",
  "loading",
  "poster",
  "controls",
  "autoplay",
  "loop",
  "muted",
  "playsinline",
  "role",
  "dir",
  "lang",
  "type",
  "name",
  "value",
  "placeholder",
  "for",
  "colspan",
  "rowspan",
  "tabindex",
  "download",
  "datetime",
  "cite",
  "start",
  "reversed",
]);

/** HTML attribute names whose React prop is spelled differently. */
const REACT_PROP_NAMES: Readonly<Record<string, string>> = {
  for: "htmlFor",
  colspan: "colSpan",
  rowspan: "rowSpan",
  tabindex: "tabIndex",
  autoplay: "autoPlay",
  playsinline: "playsInline",
  datetime: "dateTime",
};

/** Attributes whose value is a URL. */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set(["href", "src", "poster"]);

/**
 * The React props of a plain stored node's attributes: a safe allow-list plus
 * `aria-*` and `data-*`, with URL values checked (`safeUrl`), `on*` handlers
 * and `style` strings dropped, and HTML names mapped to React's. A `_blank`
 * target gets `rel="noopener noreferrer"`.
 *
 * @param attributes the stored attributes
 */
export function toPlainProps(
  attributes: Record<string, unknown> | undefined
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  if (!attributes) return props;
  let blankTarget = false;
  let rel: string | undefined;

  for (const [key, value] of Object.entries(attributes)) {
    const lower = key.toLowerCase();
    if (lower.startsWith("on") || lower === "style" || lower === "class") continue;
    const isAria = lower.startsWith("aria-");
    const isData = lower.startsWith("data-");
    if (!isAria && !isData && !SAFE_ATTRIBUTES.has(lower)) continue;

    if (URL_ATTRIBUTES.has(lower)) {
      const url = safeUrl(value);
      if (url !== undefined) props[lower] = url;
      continue;
    }
    if (lower === "target") {
      blankTarget = value === "_blank";
      continue;
    }
    if (lower === "rel") {
      rel = typeof value === "string" ? value : undefined;
      continue;
    }
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")
      continue;
    props[isAria || isData ? lower : (REACT_PROP_NAMES[lower] ?? lower)] = value;
  }

  if (blankTarget) {
    const tokens = new Set((rel ?? "").split(/\s+/).filter(Boolean));
    tokens.add("noopener");
    tokens.add("noreferrer");
    props.target = "_blank";
    props.rel = [...tokens].join(" ");
  } else if (rel) {
    props.rel = rel;
  }

  return props;
}

/** CSS values that fetch or run something; dropped from inline styles. */
const UNSAFE_STYLE_VALUE = /expression\s*\(|javascript:|vbscript:|behavior\s*:|@import|[<>]/i;

/**
 * A stored node's inline `style` as a React style object: declarations with
 * unsafe values are dropped, `kebab-case` properties become `camelCase`.
 *
 * @param style the stored `style` record
 */
export function toInlineStyle(style: unknown): CSSProperties | undefined {
  if (!style || typeof style !== "object" || Array.isArray(style)) return undefined;
  const out: Record<string, string> = {};
  for (const [property, value] of Object.entries(style as Record<string, unknown>)) {
    if (typeof value !== "string" || UNSAFE_STYLE_VALUE.test(value)) continue;
    const name = property.startsWith("--")
      ? property
      : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    out[name] = value;
  }
  return Object.keys(out).length ? (out as CSSProperties) : undefined;
}
