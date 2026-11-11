import { cn, textDirection } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options, sample } from "../shared/defaults";

const COLUMN_COUNTS: Readonly<Record<string, string>> = {
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
  "4": "md:grid-cols-2 lg:grid-cols-4",
};

export const FEATURE_GRID_FIELDS = defineFields([
  {
    name: "title",
    label: "Title",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Why it works", "چرا کار می‌کند"),
  },
  {
    name: "subtitle",
    label: "Subtitle",
    type: "textarea",
    category: "Content",
    translatable: true,
    default: sample("Three reasons, one row.", "سه دلیل، در یک ردیف."),
  },
  {
    name: "columns",
    label: "Columns",
    type: "select",
    category: "Layout",
    default: "3",
    options: options([
      ["2", "Two"],
      ["3", "Three"],
      ["4", "Four"],
    ]),
  },
]);

/** A titled grid of `feature-card` blocks. */
export function FeatureGridBlockComponent({
  attributes,
  locale,
  defaultLocale,
  children,
  className,
  id,
}: BlockProps) {
  const { title, subtitle, columns } = fieldsToProps(FEATURE_GRID_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  return (
    <section id={id} className={cn("flex flex-col gap-10", className)}>
      {title || subtitle ? (
        <header className="mx-auto flex max-w-2xl flex-col gap-3 text-center">
          {title ? (
            <h2
              dir={textDirection(title)}
              className="text-3xl font-semibold tracking-tight text-balance"
            >
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p dir={textDirection(subtitle)} className="text-muted-foreground text-lg text-pretty">
              {subtitle}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className={cn("grid grid-cols-1 gap-6", COLUMN_COUNTS[columns] ?? COLUMN_COUNTS["3"])}>
        {children}
      </div>
    </section>
  );
}

export const FeatureGridBlock: BuilderBlockDefinition = {
  type: "feature-grid",
  label: "Feature grid",
  category: "Marketing",
  icon: "layout-grid",
  description: "A titled grid of feature cards.",
  fields: [...FEATURE_GRID_FIELDS],
  defaults: fieldDefaults(FEATURE_GRID_FIELDS),
  children: ["feature-card"],
  component: FeatureGridBlockComponent,
  initialChildren: [
    { type: "feature-card", attributes: { icon: "zap" } },
    { type: "feature-card", attributes: { icon: "shield-check" } },
    { type: "feature-card", attributes: { icon: "globe" } },
  ],
};
