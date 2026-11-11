import { cn, textDirection } from "@utils";
import { AccordionContent, AccordionItem, AccordionTrigger } from "../../../ui/accordion";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { sample } from "../shared/defaults";

export const FAQ_ITEM_FIELDS = defineFields([
  {
    name: "question",
    label: "Question",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("How do I add a block?", "چگونه بلوکی اضافه کنم؟"),
  },
  {
    name: "answer",
    label: "Answer",
    type: "textarea",
    category: "Content",
    translatable: true,
    default: sample(
      "Drag it from the palette onto the canvas, then edit its fields in the settings panel.",
      "آن را از پالت به بوم بکشید و سپس فیلدهایش را در پنل تنظیمات ویرایش کنید."
    ),
  },
]);

/** One question and answer of a `faq` block, drawn as a shadcn Accordion item. */
export function FaqItemBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { question, answer } = fieldsToProps(FAQ_ITEM_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  return (
    <AccordionItem id={id} value={id ?? question} className={className}>
      <AccordionTrigger dir={textDirection(question)} className="text-base">
        {question}
      </AccordionTrigger>
      <AccordionContent>
        <p
          dir={textDirection(answer)}
          className={cn("text-muted-foreground text-base leading-relaxed whitespace-pre-line")}
        >
          {answer}
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

export const FaqItemBlock: BuilderBlockDefinition = {
  type: "faq-item",
  label: "FAQ item",
  category: "Content",
  icon: "circle-help",
  description: "One question and its answer inside an FAQ.",
  fields: [...FAQ_ITEM_FIELDS],
  defaults: fieldDefaults(FAQ_ITEM_FIELDS),
  childOf: "faq",
  component: FaqItemBlockComponent,
};
