import { cn, textDirection } from "@utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { sample } from "../shared/defaults";
import { BLOCK_ICON_OPTIONS, BLOCK_ICONS } from "../shared/icons";

export const FEATURE_CARD_FIELDS = defineFields([
  {
    name: "icon",
    label: "Icon",
    type: "select",
    category: "Content",
    default: "sparkles",
    options: BLOCK_ICON_OPTIONS,
  },
  {
    name: "title",
    label: "Title",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Quick to set up", "راه‌اندازی سریع"),
  },
  {
    name: "body",
    label: "Body",
    type: "textarea",
    category: "Content",
    translatable: true,
    default: sample(
      "Describe the feature in one or two sentences.",
      "ویژگی را در یک یا دو جمله توضیح دهید."
    ),
  },
]);

/** One card of a `feature-grid`: an icon, a title and a short body. */
export function FeatureCardBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { icon, title, body } = fieldsToProps(FEATURE_CARD_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  const Icon = BLOCK_ICONS[icon] ?? BLOCK_ICONS.sparkles;
  return (
    <Card id={id} className={cn("h-full gap-4", className)}>
      <CardHeader className="gap-4">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-lg"
        >
          <Icon className="size-5" />
        </span>
        <CardTitle dir={textDirection(title)} className="text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      {body ? (
        <CardContent>
          <p dir={textDirection(body)} className="text-muted-foreground text-sm leading-relaxed">
            {body}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export const FeatureCardBlock: BuilderBlockDefinition = {
  type: "feature-card",
  label: "Feature card",
  category: "Marketing",
  icon: "square-check",
  description: "An icon, a title and a short text inside a Feature grid.",
  fields: [...FEATURE_CARD_FIELDS],
  defaults: fieldDefaults(FEATURE_CARD_FIELDS),
  childOf: "feature-grid",
  component: FeatureCardBlockComponent,
};
