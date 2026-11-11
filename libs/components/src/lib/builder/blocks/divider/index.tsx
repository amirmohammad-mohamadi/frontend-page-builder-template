import { cn } from "@utils";
import { Separator } from "../../../ui/separator";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options } from "../shared/defaults";

const SPACINGS: Readonly<Record<string, string>> = {
  sm: "py-2",
  md: "py-4",
  lg: "py-8",
};

const DASHED_LINES: Readonly<Record<string, string>> = {
  dashed: "border-dashed",
  dotted: "border-dotted",
};

export const DIVIDER_FIELDS = defineFields([
  {
    name: "lineStyle",
    label: "Line",
    type: "select",
    category: "Layout",
    default: "solid",
    options: options([
      ["solid", "Solid"],
      ["dashed", "Dashed"],
      ["dotted", "Dotted"],
    ]),
  },
  {
    name: "spacing",
    label: "Spacing",
    type: "select",
    category: "Layout",
    default: "md",
    options: options([
      ["sm", "Small"],
      ["md", "Medium"],
      ["lg", "Large"],
    ]),
  },
]);

/** A horizontal rule: the shadcn Separator, or a dashed / dotted border line. */
export function DividerBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { lineStyle, spacing } = fieldsToProps(DIVIDER_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  const dashed = DASHED_LINES[lineStyle];
  return (
    <div id={id} className={cn("w-full", SPACINGS[spacing] ?? SPACINGS.md, className)}>
      {dashed ? (
        <hr className={cn("border-border w-full border-t", dashed)} />
      ) : (
        <Separator decorative />
      )}
    </div>
  );
}

export const DividerBlock: BuilderBlockDefinition = {
  type: "divider",
  label: "Divider",
  category: "Layout",
  icon: "minus",
  description: "A horizontal line between blocks.",
  fields: [...DIVIDER_FIELDS],
  defaults: fieldDefaults(DIVIDER_FIELDS),
  component: DividerBlockComponent,
};
