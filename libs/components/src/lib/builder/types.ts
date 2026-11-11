import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { ComponentJSON } from "./component-json";
import type { FieldDef } from "./fields/types";

/** The palette groups blocks are listed under. */
export type BlockCategory = "Layout" | "Content" | "Media" | "Marketing";

/**
 * What every block component receives from the renderer and from the editor
 * canvas alike. The block reads its typed values with `fieldsToProps` from
 * `attributes`; children are the rendered child components.
 */
export type BlockProps = {
  /** The stored attributes, as strings. */
  attributes: Record<string, string>;
  /** The locale being rendered. */
  locale: string;
  /** The locale a missing translation falls back to. */
  defaultLocale: string;
  /** The rendered child components (a container's content). */
  children?: ReactNode;
  /** The node's stored classes, for the block's root element. */
  className?: string;
  /** The node's id, for the block's root element (anchors, canvas selection). */
  id?: string;
};

/**
 * A block of the page builder: the one definition the admin editor derives its
 * component type, traits and palette entry from, and the web app renders from.
 */
export type BuilderBlockDefinition = {
  /** The GrapesJS component type id (`section`, `feature-card`, …). */
  type: string;
  /** The palette label. */
  label: string;
  category: BlockCategory;
  /** A lucide icon name for the palette (`layout-template`). */
  icon?: string;
  description?: string;
  /** The fields; the editor derives the traits from them. */
  fields: FieldDef[];
  /** Attribute defaults a fresh drop starts with; translatable ones as serialized locale records. */
  defaults?: Record<string, string>;
  /** The child types the block accepts; unset means any (when droppable) or none. */
  children?: string[];
  /** The only parent type the block may sit in. */
  childOf?: string;
  /** Whether other blocks can be dropped into it. */
  droppable?: boolean;
  /** The React component the renderer and the canvas both draw. */
  component: ComponentType<BlockProps>;
  /** Inline style for the canvas wrapper element (an empty container's minimum height). */
  wrapperStyle?: CSSProperties;
  /** What a fresh drop contains (two columns, two FAQ items, …). */
  initialChildren?: ComponentJSON[];
};
