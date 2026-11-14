import type { Component, Editor, Trait, TraitSetValueOptions } from "grapesjs";
import type { FileAccept, FieldType } from "@components/builder";

/** The input a `translatable` trait draws: one line, several lines, or formatted text. */
export type TranslatableVariant = "text" | "textarea" | "richtext";

/**
 * A builder trait definition, widened beyond core's `TraitProperties` to carry what the custom
 * trait views read (`accept` for the media picker, `variant` for the translatable editor,
 * `fieldType` for the kind the field was declared with), whichever editor shell renders them.
 */
export type BuilderTraitDefinition = {
  type?: string;
  name?: string;
  id?: string;
  label?: string | false;
  category?: string;
  placeholder?: string;
  default?: unknown;
  value?: unknown;
  options?: { id: string; value?: string; label?: string }[];
  min?: number;
  max?: number;
  step?: number;
  changeProp?: boolean;
  valueTrue?: string;
  valueFalse?: string;
  /** The media kinds a `file` trait's picker offers. */
  accept?: FileAccept;
  /** The editor a `translatable` trait draws. */
  variant?: TranslatableVariant;
  /** The field kind the trait was derived from. */
  fieldType?: FieldType;
  getValue?: (props: { editor: Editor; trait: Trait; component: Component }) => unknown;
  setValue?: (props: {
    value: unknown;
    editor: Editor;
    trait: Trait;
    component: Component;
    partial: boolean;
    options: TraitSetValueOptions;
    emitUpdate: () => void;
  }) => void;
};
