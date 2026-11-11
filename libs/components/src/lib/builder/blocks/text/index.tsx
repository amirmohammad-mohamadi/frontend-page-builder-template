import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import { sanitizeHtml } from "../../sanitize/sanitize-html";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { ALIGN_CLASSES, ALIGN_OPTIONS, options, sample } from "../shared/defaults";

const SIZES: Readonly<Record<string, string>> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

/** The look of the rich text's own elements (paragraphs, lists, links). */
const RICH_TEXT_CLASSES =
  "leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_p+p]:mt-4 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6";

export const TEXT_FIELDS = defineFields([
  {
    name: "html",
    label: "Text",
    type: "richtext",
    category: "Content",
    translatable: true,
    default: sample(
      '<p>Write your text here. A paragraph can hold <strong>bold</strong>, <em>italic</em> and <a href="#">links</a>.</p>',
      '<p>متن خود را اینجا بنویسید. یک پاراگراف می‌تواند <strong>پررنگ</strong>، <em>مورب</em> و <a href="#">پیوند</a> داشته باشد.</p>'
    ),
  },
  {
    name: "size",
    label: "Size",
    type: "select",
    category: "Layout",
    default: "md",
    options: options([
      ["sm", "Small"],
      ["md", "Medium"],
      ["lg", "Large"],
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

/**
 * A translatable rich-text paragraph. The stored HTML is reduced to the
 * rich-text allow-list (`p`, `strong`, `em`, `a`, lists, `br`, `span`) before it
 * is written to the page.
 */
export function TextBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { html, size, align } = fieldsToProps(TEXT_FIELDS, attributes, { locale, defaultLocale });
  const safe = sanitizeHtml(html);
  return (
    <div
      id={id}
      className={cn(
        RICH_TEXT_CLASSES,
        SIZES[size] ?? SIZES.md,
        ALIGN_CLASSES[align] ?? ALIGN_CLASSES.start,
        className
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

export const TextBlock: BuilderBlockDefinition = {
  type: "text",
  label: "Text",
  category: "Content",
  icon: "text",
  description: "A paragraph of formatted text.",
  fields: [...TEXT_FIELDS],
  defaults: fieldDefaults(TEXT_FIELDS),
  component: TextBlockComponent,
};
