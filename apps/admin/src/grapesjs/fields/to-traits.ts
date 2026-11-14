import type { FieldDef } from "@components/builder";
import { TEXTS } from "@/texts";
import type { BuilderTraitDefinition } from "./types";

/** The trait type a field kind is edited with. */
const TRAIT_TYPES: Readonly<Record<FieldDef["type"], string>> = {
  text: "text",
  textarea: "textarea",
  richtext: "textarea",
  number: "number",
  select: "select",
  checkbox: "checkbox",
  color: "color",
  image: "file",
  video: "file",
  href: "href",
  // No block declares a `list` field today; a comma-separated text is what `fieldsToProps`
  // reads (`parseList`), so a plain text input edits it until a block needs a row editor.
  list: "text",
};

/**
 * Converts one block's field definitions into the GrapesJS `traits` array its component type
 * is registered with. A translatable field (`text`, `textarea` or `richtext`) becomes a
 * `translatable` trait that edits the current editing locale's text inside the stored
 * locale record; everything else maps onto a core trait type or one of the custom ones
 * (`file`, `href`). Every trait is named after its field, so it reads and writes the
 * attribute the block's `fieldsToProps` reads.
 *
 * @param fields the block's `fields`
 */
export function toTraits(fields: readonly FieldDef[]): BuilderTraitDefinition[] {
  return fields.map((field) => toTrait(field));
}

/** The trait of one field. */
export function toTrait(field: FieldDef): BuilderTraitDefinition {
  const base: BuilderTraitDefinition = {
    name: field.name,
    label: field.label,
    category: field.category,
    placeholder: field.placeholder,
    default: field.default,
    fieldType: field.type,
  };

  if (field.translatable && isTranslatableType(field.type)) {
    return { ...base, type: "translatable", variant: field.type };
  }

  switch (field.type) {
    case "select":
      return {
        ...base,
        type: "select",
        options: (field.options ?? []).map((option) => ({
          id: option.id,
          value: option.id,
          label: option.label,
        })),
      };
    case "number":
      return { ...base, type: "number", min: field.min, max: field.max, step: field.step };
    case "checkbox":
      // Core's checkbox writes `valueTrue`/`valueFalse`; the blocks read `"true"`/`"false"`.
      return { ...base, type: "checkbox", valueTrue: "true", valueFalse: "false" };
    case "image":
    case "video":
      return { ...base, type: "file", accept: field.accept ?? field.type };
    case "list":
      return {
        ...base,
        type: "text",
        placeholder: field.placeholder ?? TEXTS.builder.traits.listPlaceholder,
      };
    default:
      return { ...base, type: TRAIT_TYPES[field.type] };
  }
}

/** Whether a field kind may be translatable (the lib allows it on text kinds only). */
function isTranslatableType(type: FieldDef["type"]): type is "text" | "textarea" | "richtext" {
  return type === "text" || type === "textarea" || type === "richtext";
}
