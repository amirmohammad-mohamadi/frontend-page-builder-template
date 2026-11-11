import { createElement, Fragment, type JSX, type ReactNode } from "react";
import { BUILDER_BLOCKS } from "./blocks";
import type { ComponentJSON } from "./component-json";
import { FALLBACK_LOCALE } from "./fields/translatable";
import { safeTagName, toClassNames, toInlineStyle, toPlainProps, VOID_TAGS } from "./plain-blocks";
import { rulesToCss } from "./rules-to-css";
import { sanitizeBuilderTree } from "./sanitize/sanitize-builder-tree";
import { sanitizeCss } from "./sanitize/sanitize-css";
import { PLAIN_CONTENT_TAGS, sanitizeHtml } from "./sanitize/sanitize-html";
import type { BuilderBlockDefinition } from "./types";

export type { ComponentJSON } from "./component-json";

/**
 * Render-time context the app hands to a stored tree. Nothing here comes from
 * the stored JSON; it is what the request knows.
 */
export type RenderComponentOptions = {
  /** The locale being rendered. */
  locale: string;
  /** The locale a missing translation falls back to (`"en"` when omitted). */
  defaultLocale?: string;
  /** The block registry to render with; `BUILDER_BLOCKS` by default. */
  blocks?: Record<string, BuilderBlockDefinition>;
  /** The React key of the returned element (a list of siblings). */
  key?: string | number;
};

/** The element of a core GrapesJS type stored without a `tagName` (the type's default tag). */
const CORE_TAGS: Readonly<Record<string, string>> = {
  text: "div",
  link: "a",
  image: "img",
  label: "label",
};

/** A stable React key for a child: its stored id, else its position. */
function childKey(child: ComponentJSON, index: number): string {
  const id = child.attributes?.id ?? (typeof child.id === "string" ? child.id : undefined);
  return id ? `${id}` : `node-${index}`;
}

/** The block definition for a stored type, matched exactly first, then case-insensitively. */
function findBlock(
  type: string | undefined,
  blocks: Record<string, BuilderBlockDefinition>
): BuilderBlockDefinition | undefined {
  if (!type) return undefined;
  if (blocks[type]) return blocks[type];
  const lower = type.toLowerCase();
  return Object.values(blocks).find((block) => block.type.toLowerCase() === lower);
}

/**
 * Renders one stored component node (and its children) to React. A node whose
 * `type` is a registered block renders that block's component with the stored
 * attributes and the locale context; every other node is a plain element:
 * a safe tag, the stored classes as `className`, a safe allow-list of
 * attributes and sanitized HTML content. A `textnode` is its text.
 *
 * Works in React Server Components: nothing here needs a browser.
 *
 * @param node the stored node (null renders nothing)
 * @param options the locale context, an optional block registry and the element key
 */
export function renderComponent(
  node: ComponentJSON | null | undefined,
  options: RenderComponentOptions
): ReactNode {
  if (!node || typeof node !== "object") return null;

  const type = typeof node.type === "string" ? node.type : undefined;
  if (type === "textnode") return typeof node.content === "string" ? node.content : null;
  if (type === "comment") return null;

  const blocks = options.blocks ?? BUILDER_BLOCKS;
  const locale = options.locale;
  const defaultLocale = options.defaultLocale ?? FALLBACK_LOCALE;
  const childOptions: RenderComponentOptions = { locale, defaultLocale, blocks };

  const storedChildren = Array.isArray(node.components) ? node.components : [];
  const children = storedChildren.map((child, index) => (
    <Fragment key={childKey(child, index)}>{renderComponent(child, childOptions)}</Fragment>
  ));
  const hasChildren = children.length > 0;

  const classNames = toClassNames(node.classes);
  const className = classNames.length ? classNames.join(" ") : undefined;
  const id = typeof node.attributes?.id === "string" ? node.attributes.id : undefined;

  const block = findBlock(type, blocks);
  if (block) {
    return createElement(
      block.component,
      {
        key: options.key,
        attributes: node.attributes ?? {},
        locale,
        defaultLocale,
        className,
        id,
      },
      hasChildren ? children : undefined
    );
  }

  const tag = safeTagName(
    node.tagName ?? (type ? CORE_TAGS[type.toLowerCase()] : undefined),
    "div"
  ) as keyof JSX.IntrinsicElements;
  const props: Record<string, unknown> = {
    key: options.key,
    className,
    style: toInlineStyle(node.style),
    ...toPlainProps(node.attributes),
  };

  if (VOID_TAGS.has(tag)) return createElement(tag, props);
  if (hasChildren) return createElement(tag, props, children);

  const html = typeof node.components === "string" ? node.components : node.content;
  const sanitized = sanitizeHtml(html, PLAIN_CONTENT_TAGS);
  if (!sanitized) return createElement(tag, props);
  return createElement(tag, { ...props, dangerouslySetInnerHTML: { __html: sanitized } });
}

/** A page's stored content: the component tree, the CSS rules and the compiled CSS. */
export type PageContent = {
  /** The root's children. */
  components: ComponentJSON[];
  /** The editor's CSS rules; compiled when `css` is missing. */
  styles?: unknown[];
  /** The compiled CSS the editor saved. */
  css?: string;
};

/** Options of `renderPageContent`: the locale context and an optional block registry. */
export type RenderPageContentOptions = Omit<RenderComponentOptions, "key">;

/**
 * Renders a page: sanitizes the tree (`sanitizeBuilderTree`) and the CSS
 * (`sanitizeCss`), then returns a `<style>` with the page CSS followed by the
 * rendered root components. Server-safe; the web app calls it from a page.
 *
 * @param content the page's stored `draft` or `published` content
 * @param options the locale context and an optional block registry
 */
export function renderPageContent(
  content: PageContent | null | undefined,
  options: RenderPageContentOptions
): ReactNode {
  if (!content) return null;
  const components = Array.isArray(content.components) ? content.components : [];
  const css = sanitizeCss(content.css || rulesToCss(content.styles));

  return (
    <>
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {components.map((node, index) =>
        renderComponent(sanitizeBuilderTree(node), { ...options, key: childKey(node, index) })
      )}
    </>
  );
}
