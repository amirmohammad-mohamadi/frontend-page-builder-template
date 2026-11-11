import { createElement } from "react";
import { cn, textDirection } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { ALIGN_CLASSES, ALIGN_OPTIONS, options, sample } from "../shared/defaults";

const LEVEL_CLASSES: Readonly<Record<string, string>> = {
  "1": "text-4xl font-bold tracking-tight md:text-5xl",
  "2": "text-3xl font-semibold tracking-tight md:text-4xl",
  "3": "text-2xl font-semibold",
  "4": "text-xl font-semibold",
};

export const HEADING_FIELDS = defineFields([
  {
    name: "text",
    label: "Text",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Section heading", "عنوان بخش"),
  },
  {
    name: "level",
    label: "Level",
    type: "select",
    category: "Layout",
    default: "2",
    options: options([
      ["1", "Heading 1"],
      ["2", "Heading 2"],
      ["3", "Heading 3"],
      ["4", "Heading 4"],
    ]),
  },
  {
    name: "align",
    label: "Alignment",
    type: "select",
    category: "Layout",
    default: "start",
    options: ALIGN_OPTIONS,
  },
]);

/** A heading of level 1 to 4 with a translatable text. */
export function HeadingBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { text, level, align } = fieldsToProps(HEADING_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  const safeLevel = LEVEL_CLASSES[level] ? level : "2";
  return createElement(
    `h${safeLevel}`,
    {
      id,
      dir: textDirection(text),
      className: cn(
        "text-balance",
        LEVEL_CLASSES[safeLevel],
        ALIGN_CLASSES[align] ?? ALIGN_CLASSES.start,
        className
      ),
    },
    text
  );
}

export const HeadingBlock: BuilderBlockDefinition = {
  type: "heading",
  label: "Heading",
  category: "Content",
  icon: "heading",
  description: "A title line, level 1 to 4.",
  fields: [...HEADING_FIELDS],
  defaults: fieldDefaults(HEADING_FIELDS),
  component: HeadingBlockComponent,
};
