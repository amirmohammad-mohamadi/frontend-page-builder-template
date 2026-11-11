import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { BlockLink } from "../shared/block-link";
import { options, sample } from "../shared/defaults";

/** The shadcn Button variants a block may pick. */
export const BUTTON_VARIANT_OPTIONS = options([
  ["default", "Primary"],
  ["secondary", "Secondary"],
  ["outline", "Outline"],
  ["ghost", "Ghost"],
  ["link", "Link"],
  ["destructive", "Destructive"],
]);

export const BUTTON_SIZE_OPTIONS = options([
  ["default", "Default"],
  ["sm", "Small"],
  ["lg", "Large"],
]);

export const BUTTON_FIELDS = defineFields([
  {
    name: "label",
    label: "Label",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Learn more", "بیشتر بدانید"),
  },
  { name: "href", label: "Link", type: "href", category: "Content", default: "#" },
  {
    name: "variant",
    label: "Style",
    type: "select",
    category: "Layout",
    default: "default",
    options: BUTTON_VARIANT_OPTIONS,
  },
  {
    name: "size",
    label: "Size",
    type: "select",
    category: "Layout",
    default: "default",
    options: BUTTON_SIZE_OPTIONS,
  },
  {
    name: "external",
    label: "Open in a new tab",
    type: "checkbox",
    category: "Behavior",
    default: "false",
  },
]);

/** One link drawn as a shadcn Button. */
export function ButtonBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { label, href, variant, size, external } = fieldsToProps(BUTTON_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  return (
    <div id={id} className={cn("inline-flex", className)}>
      <BlockLink href={href} label={label} variant={variant} size={size} external={external} />
    </div>
  );
}

export const ButtonBlock: BuilderBlockDefinition = {
  type: "button",
  label: "Button",
  category: "Content",
  icon: "mouse-pointer-click",
  description: "A link drawn as a button.",
  fields: [...BUTTON_FIELDS],
  defaults: fieldDefaults(BUTTON_FIELDS),
  component: ButtonBlockComponent,
};
