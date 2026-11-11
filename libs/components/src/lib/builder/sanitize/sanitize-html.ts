/**
 * A small allow-list HTML sanitizer for author-written rich text, with no DOM
 * and no dependency, so it runs the same in React Server Components, on the
 * client and in the editor canvas.
 *
 * Only the tags in `allowedTags` survive, with the attributes in
 * `allowedAttributes`; everything else is dropped (the content of a script,
 * style or similar raw-text element with it). Every `<` or `>` in the output
 * comes from a tag this sanitizer wrote itself, so no stored text can open an
 * element it does not allow. Links keep only safe schemes and a `_blank`
 * target gets `rel="noopener noreferrer"`.
 */

/** Tags rich text may use (the editor's text formatting plus lists and links). */
export const RICH_TEXT_TAGS: ReadonlySet<string> = new Set([
  "p",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "br",
  "span",
]);

/** Tags a plain stored node's HTML content may use: rich text plus headings and quotes. */
export const PLAIN_CONTENT_TAGS: ReadonlySet<string> = new Set([
  ...RICH_TEXT_TAGS,
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
  "div",
  "small",
  "sub",
  "sup",
  "hr",
]);

/** Attributes allowed on any kept tag (`class` for the editor's formatting classes). */
const GLOBAL_ATTRIBUTES: ReadonlySet<string> = new Set(["class", "dir", "lang", "title", "id"]);

/** Attributes allowed on specific tags, on top of the global ones. */
const TAG_ATTRIBUTES: Readonly<Record<string, ReadonlySet<string>>> = {
  a: new Set(["href", "target", "rel"]),
};

/** Elements whose text content is script or style, dropped with the element. */
const RAW_TEXT_TAGS: ReadonlySet<string> = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "noscript",
  "template",
  "svg",
  "math",
  "textarea",
  "title",
  "xmp",
]);

/** Tags that never take a closing tag. */
const VOID_HTML_TAGS: ReadonlySet<string> = new Set(["br", "hr", "img", "wbr"]);

/** A URL whose scheme is safe to link to; relative, anchor and query URLs pass. */
const SAFE_URL = /^(?:(?:https?|mailto|tel|sms):|data:image\/|[/#?.]|[^:/?#]*(?:[/?#]|$))/i;

/**
 * `url` when it is safe to use as a link or media source, else `undefined`.
 * Control characters are stripped first so `java\tscript:` cannot slip through.
 *
 * @param url the author-written URL
 */
export function safeUrl(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const cleaned = url.replace(/[\u0000-\u001F\u007F\s]/g, "");
  if (cleaned === "") return undefined;
  return SAFE_URL.test(cleaned) ? url.trim() : undefined;
}

const ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  "#39": "'",
};

/** Decodes the few entities that matter for inspecting an attribute value. */
function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return match;
  });
}

/** Escapes a value for a double-quoted attribute. */
function escapeAttribute(value: string): string {
  return value.replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z]+);)/gi, "&amp;").replace(/"/g, "&quot;");
}

const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;

/** Rebuilds an opening tag with only the allowed, safe attributes. */
function cleanOpenTag(tag: string, rawAttributes: string): string {
  const allowed = TAG_ATTRIBUTES[tag];
  const kept: string[] = [];
  let hasBlankTarget = false;
  let rel: string | undefined;

  for (const match of rawAttributes.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if (name.startsWith("on")) continue;
    if (!GLOBAL_ATTRIBUTES.has(name) && !allowed?.has(name)) continue;

    if (name === "href") {
      const href = safeUrl(decodeEntities(value));
      if (href !== undefined) kept.push(`href="${escapeAttribute(href)}"`);
      continue;
    }
    if (name === "target") {
      if (decodeEntities(value) === "_blank") hasBlankTarget = true;
      continue;
    }
    if (name === "rel") {
      rel = decodeEntities(value);
      continue;
    }
    if (name === "dir") {
      const dir = decodeEntities(value).toLowerCase();
      if (dir === "ltr" || dir === "rtl" || dir === "auto") kept.push(`dir="${dir}"`);
      continue;
    }
    kept.push(`${name}="${escapeAttribute(value)}"`);
  }

  if (hasBlankTarget) {
    const tokens = new Set((rel ?? "").split(/\s+/).filter(Boolean));
    tokens.add("noopener");
    tokens.add("noreferrer");
    kept.push('target="_blank"', `rel="${[...tokens].join(" ")}"`);
  }

  return kept.length ? `<${tag} ${kept.join(" ")}>` : `<${tag}>`;
}

/** Escapes stray tag delimiters in text that is not a recognised tag. */
function escapeText(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * A comment, a tag (opening or closing), or a bogus `<!…>` / `<?…>` / `</…>`
 * declaration. A `<` followed by anything else is text, as in HTML.
 */
const TOKEN =
  /<!--[\s\S]*?(?:-->|$)|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>?|<[!?/][^>]*>?/g;

/**
 * Sanitizes author-written HTML to the allowed tags and attributes. The result
 * is balanced: unmatched closing tags are dropped and open tags are closed at
 * the end, so it can be placed inside any element.
 *
 * @param html the stored HTML (anything but a string gives `""`)
 * @param allowedTags the tags to keep; `RICH_TEXT_TAGS` by default
 */
export function sanitizeHtml(
  html: unknown,
  allowedTags: ReadonlySet<string> = RICH_TEXT_TAGS
): string {
  if (typeof html !== "string" || html === "") return "";

  let out = "";
  const open: string[] = [];
  let skipUntil: string | undefined;
  let last = 0;

  for (const match of html.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    const text = html.slice(last, index);
    if (!skipUntil) out += escapeText(text);
    last = index + match[0].length;

    const token = match[0];
    const name = match[1]?.toLowerCase();
    const isClosing = token.startsWith("</");

    if (skipUntil) {
      if (isClosing && name === skipUntil) skipUntil = undefined;
      continue;
    }
    if (!name) continue; // a comment, a doctype or a stray `<`
    if (isClosing) {
      const at = open.lastIndexOf(name);
      if (at === -1) continue;
      while (open.length > at) out += `</${open.pop()}>`;
      continue;
    }
    if (RAW_TEXT_TAGS.has(name)) {
      if (!token.endsWith("/>")) skipUntil = name;
      continue;
    }
    if (!allowedTags.has(name)) continue;

    const rawAttributes = (match[2] ?? "").replace(/\/\s*$/, "");
    out += cleanOpenTag(name, rawAttributes);
    if (!VOID_HTML_TAGS.has(name)) open.push(name);
  }

  if (!skipUntil) out += escapeText(html.slice(last));
  while (open.length) out += `</${open.pop()}>`;
  return out;
}
