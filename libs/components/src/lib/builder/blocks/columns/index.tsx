import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options } from "../shared/defaults";

const COLUMN_COUNTS: Readonly<Record<string, string>> = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "4": "md:grid-cols-2 lg:grid-cols-4",
};

const GAPS: Readonly<Record<string, string>> = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-10",
};

export const COLUMNS_FIELDS = defineFields([
  {
    name: "count",
    label: "Columns",
    type: "select",
    category: "Layout",
    default: "2",
    options: options([
      ["2", "Two"],
      ["3", "Three"],
      ["4", "Four"],
    ]),
  },
  {
    name: "gap",
    label: "Gap",
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

/** An equal-column grid that stacks on phones; its children are `column` blocks. */
export function ColumnsBlockComponent({
  attributes,
  locale,
  defaultLocale,
  children,
  className,
  id,
}: BlockProps) {
  const { count, gap } = fieldsToProps(COLUMNS_FIELDS, attributes, { locale, defaultLocale });
  return (
    <div
      id={id}
      className={cn(
        "grid grid-cols-1",
        COLUMN_COUNTS[count] ?? COLUMN_COUNTS["2"],
        GAPS[gap] ?? GAPS.md,
        className
      )}
    >
      {children}
    </div>
  );
}

export const ColumnsBlock: BuilderBlockDefinition = {
  type: "columns",
  label: "Columns",
  category: "Layout",
  icon: "columns-3",
  description: "Two to four columns side by side, stacked on phones.",
  fields: [...COLUMNS_FIELDS],
  defaults: fieldDefaults(COLUMNS_FIELDS),
  children: ["column"],
  component: ColumnsBlockComponent,
  initialChildren: [{ type: "column" }, { type: "column" }],
};
