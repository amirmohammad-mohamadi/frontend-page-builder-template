/**
 * One node of a stored GrapesJS component tree, as the editor saves it and the
 * renderer reads it. A page's `components` is a list of these (the root's
 * children). Only the keys the renderer reads are typed; GrapesJS adds more.
 */
export type ComponentJSON = {
  /** The component type: a block type id, a core type (`text`, `textnode`, `image`) or none for a plain node. */
  type?: string;
  /** The HTML tag of a plain node. */
  tagName?: string;
  /** Stored attributes; a block's fields live here as strings. */
  attributes?: Record<string, string>;
  /** Class names; GrapesJS stores private selectors as `{ name }` objects. */
  classes?: (string | { name: string })[];
  /** Children, or an HTML string GrapesJS has not parsed yet. */
  components?: ComponentJSON[] | string;
  /** A textnode's text, or a plain node's HTML content. */
  content?: string;
  /** Inline styles GrapesJS kept on the node. */
  style?: Record<string, string>;
  [key: string]: unknown;
};
