import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options } from "../shared/defaults";

const SIZES: Readonly<Record<string, string>> = {
  xs: "h-4",
  sm: "h-8",
  md: "h-16",
  lg: "h-24",
  xl: "h-32",
};

export const SPACER_FIELDS = defineFields([
  {
    name: "size",
    label: "Height",
    type: "select",
    category: "Layout",
    default: "md",
    options: options([
      ["xs", "Extra small"],
      ["sm", "Small"],
      ["md", "Medium"],
      ["lg", "Large"],
      ["xl", "Extra large"],
    ]),
  },
]);

/** Empty vertical space of a chosen height. */
export function SpacerBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { size } = fieldsToProps(SPACER_FIELDS, attributes, { locale, defaultLocale });
  return (
    <div id={id} aria-hidden="true" className={cn("w-full", SIZES[size] ?? SIZES.md, className)} />
  );
}

export const SpacerBlock: BuilderBlockDefinition = {
  type: "spacer",
  label: "Spacer",
  category: "Layout",
  icon: "move-vertical",
  description: "Empty space between blocks.",
  fields: [...SPACER_FIELDS],
  defaults: fieldDefaults(SPACER_FIELDS),
  component: SpacerBlockComponent,
};
