import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { ALIGN_CLASSES, ALIGN_OPTIONS } from "../shared/defaults";

const ITEM_ALIGN: Readonly<Record<string, string>> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

export const COLUMN_FIELDS = defineFields([
  {
    name: "align",
    label: "Align content",
    type: "select",
    category: "Layout",
    default: "start",
    options: ALIGN_OPTIONS,
  },
]);

/** One column of a `columns` block: a vertical stack other blocks drop into. */
export function ColumnBlockComponent({
  attributes,
  locale,
  defaultLocale,
  children,
  className,
  id,
}: BlockProps) {
  const { align } = fieldsToProps(COLUMN_FIELDS, attributes, { locale, defaultLocale });
  return (
    <div
      id={id}
      className={cn(
        "flex min-w-0 flex-col gap-4",
        ITEM_ALIGN[align] ?? ITEM_ALIGN.start,
        ALIGN_CLASSES[align] ?? ALIGN_CLASSES.start,
        className
      )}
    >
      {children}
    </div>
  );
}

export const ColumnBlock: BuilderBlockDefinition = {
  type: "column",
  label: "Column",
  category: "Layout",
  icon: "rectangle-vertical",
  description: "One column inside a Columns block.",
  fields: [...COLUMN_FIELDS],
  defaults: fieldDefaults(COLUMN_FIELDS),
  childOf: "columns",
  droppable: true,
  component: ColumnBlockComponent,
  wrapperStyle: { minHeight: 48 },
};
