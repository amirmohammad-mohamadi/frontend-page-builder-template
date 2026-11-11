import type { ComponentJSON } from "../component-json";
import { PLAIN_CONTENT_TAGS, safeUrl, sanitizeHtml } from "./sanitize-html";

/** Attributes whose value is a URL the browser follows or loads. */
const URL_ATTRIBUTES: ReadonlySet<string> = new Set([
  "href",
  "xlink:href",
  "src",
  "poster",
  "action",
  "formaction",
  "data",
]);

/** A cleaned copy of a node's attributes: no event handlers, no script URLs. */
function sanitizeAttributes(
  attributes: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!attributes) return attributes;
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(attributes)) {
    const lower = key.toLowerCase();
    if (lower.startsWith("on")) continue;
    if (URL_ATTRIBUTES.has(lower) && typeof value === "string") {
      // Neutralised to an inert anchor rather than dropped, so the element still renders in place.
      cleaned[key] = safeUrl(value) === undefined ? "#" : value;
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

function sanitizeNode(node: ComponentJSON): ComponentJSON {
  const next: ComponentJSON = { ...node };

  if (Array.isArray(node.components)) {
    next.components = node.components.map(sanitizeNode);
  } else if (typeof node.components === "string") {
    // A node whose children were stored as an HTML string: kept as sanitized content.
    next.components = sanitizeHtml(node.components, PLAIN_CONTENT_TAGS);
  }

  if (typeof node.content === "string" && node.type !== "textnode") {
    next.content = sanitizeHtml(node.content, PLAIN_CONTENT_TAGS);
  }

  if (node.attributes) next.attributes = sanitizeAttributes(node.attributes);

  return next;
}

/**
 * Deep-clones a stored component tree and neutralises stored-XSS vectors on
 * every node: HTML `content` is reduced to the plain-content allow-list,
 * `on*` attributes are dropped and script-scheme URLs (`javascript:`,
 * `data:text/html`, …) in link and media attributes become `#`. Block-level
 * texts (a `richtext` field) are sanitized again by the block that renders
 * them. Pure: the input is never mutated.
 *
 * @param node the parsed tree (may be null or undefined)
 */
export function sanitizeBuilderTree<T extends ComponentJSON | null | undefined>(node: T): T {
  if (!node) return node;
  return sanitizeNode(node) as T;
}
