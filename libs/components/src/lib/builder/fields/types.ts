/**
 * The kinds of field a block can declare. Every field is stored as one string
 * attribute on the GrapesJS component; the kind says how the editor edits it
 * and how `fieldsToProps` types it for the block component.
 *
 * - `text` / `textarea` / `richtext`: a string (`richtext` holds sanitized HTML)
 * - `number`: a number, stored as its decimal string
 * - `select`: one of `options`
 * - `checkbox`: a boolean, stored as `"true"` / `"false"`
 * - `color`: a theme token or CSS colour, as the editor offers it
 * - `image` / `video`: a media URL picked from the media library
 * - `href`: a link target
 * - `list`: a string list, stored as a JSON array (a comma-separated string is read too)
 */
export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "select"
  | "checkbox"
  | "color"
  | "image"
  | "video"
  | "href"
  | "list";

/** Media types an `image` / `video` field accepts, as the asset picker filters them. */
export type FileAccept = "image" | "video" | "image,video";

/** One option of a `select` field. */
export type FieldSelectOption = { id: string; label: string };

/**
 * One field of a block: the single source for the editor's trait (the admin
 * derives the Settings panel from it) and for the typed prop the block reads.
 */
export type FieldDef = {
  /** The attribute the value is stored under (also the prop name). */
  name: string;
  /** The label the editor shows. */
  label: string;
  type: FieldType;
  /** A trait group in the editor's Settings panel (`Content`, `Layout`, …). */
  category?: string;
  placeholder?: string;
  /**
   * The stored default, as an attribute string. A translatable field's default
   * is a serialized locale record (`{"en":"…","fa":"…"}`) or a plain string.
   */
  default?: string;
  /**
   * The text is visitor-facing and stored per locale (see `translatable-texts.ts`).
   * Only `text`, `textarea` and `richtext` fields may be translatable.
   */
  translatable?: boolean;
  /** `select` fields: the choices. */
  options?: readonly FieldSelectOption[];
  /** `number` fields: the editor's range. */
  min?: number;
  max?: number;
  step?: number;
  /** `image` / `video` fields: what the picker offers. */
  accept?: FileAccept;
};

/** A block as a field visibility rule reads it: its component type and its attributes. */
export type FieldBlock = { type: string; attributes: Record<string, unknown> };

/**
 * Names the fields of a block that do nothing where the block sits, so the
 * editor hides them. It gets the block first, then each block that holds it,
 * up to the page. Hiding a field never touches its attribute.
 */
export type FieldVisibilityRule = (ancestry: readonly FieldBlock[]) => readonly string[];

/** The prop type a field of the given kind resolves to. */
export type FieldValue<T extends FieldType> = T extends "number"
  ? number
  : T extends "checkbox"
    ? boolean
    : T extends "list"
      ? string[]
      : string;

/**
 * The typed props a list of field definitions resolves to, keyed by field
 * name. Declare the fields `as const` to get a precise type.
 */
export type FieldValues<F extends readonly FieldDef[]> = {
  [K in F[number] as K["name"]]: FieldValue<K["type"]>;
};
