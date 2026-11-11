import { cn, textDirection } from "@utils";
import { Accordion } from "../../../ui/accordion";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { sample } from "../shared/defaults";

export const FAQ_FIELDS = defineFields([
  {
    name: "title",
    label: "Title",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Frequently asked questions", "پرسش‌های پرتکرار"),
  },
  {
    name: "multiple",
    label: "Allow several open at once",
    type: "checkbox",
    category: "Behavior",
    default: "false",
  },
]);

/**
 * A titled accordion of `faq-item` blocks. Open state lives in the shadcn
 * Accordion (client side); the questions and answers are in the server HTML.
 */
export function FaqBlockComponent({
  attributes,
  locale,
  defaultLocale,
  children,
  className,
  id,
}: BlockProps) {
  const { title, multiple } = fieldsToProps(FAQ_FIELDS, attributes, { locale, defaultLocale });
  return (
    <section id={id} className={cn("mx-auto flex w-full max-w-3xl flex-col gap-8", className)}>
      {title ? (
        <h2
          dir={textDirection(title)}
          className="text-center text-3xl font-semibold tracking-tight text-balance"
        >
          {title}
        </h2>
      ) : null}
      {multiple ? (
        <Accordion type="multiple" className="w-full">
          {children}
        </Accordion>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {children}
        </Accordion>
      )}
    </section>
  );
}

export const FaqBlock: BuilderBlockDefinition = {
  type: "faq",
  label: "FAQ",
  category: "Content",
  icon: "message-circle-question",
  description: "Questions that open to show their answers.",
  fields: [...FAQ_FIELDS],
  defaults: fieldDefaults(FAQ_FIELDS),
  children: ["faq-item"],
  component: FaqBlockComponent,
  initialChildren: [
    { type: "faq-item" },
    {
      type: "faq-item",
      attributes: {
        question: sample("Can the content be translated?", "آیا محتوا ترجمه می‌شود؟"),
        answer: sample(
          "Yes. Every text field is stored per language and falls back to the default language.",
          "بله. هر فیلد متنی برای هر زبان جدا ذخیره می‌شود و در نبود ترجمه، زبان پیش‌فرض نمایش داده می‌شود."
        ),
      },
    },
  ],
};
