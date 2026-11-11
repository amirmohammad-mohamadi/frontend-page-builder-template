import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options } from "../shared/defaults";

/** Background choices, each a theme token pair so the text stays readable. */
const BACKGROUNDS: Readonly<Record<string, string>> = {
  default: "bg-background text-foreground",
  muted: "bg-muted text-foreground",
  card: "bg-card text-card-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  primary: "bg-primary text-primary-foreground",
};

const PADDINGS: Readonly<Record<string, string>> = {
  none: "py-0",
  sm: "py-6",
  md: "py-12",
  lg: "py-20",
  xl: "py-28",
};

const MAX_WIDTHS: Readonly<Record<string, string>> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

export const SECTION_FIELDS = defineFields([
  {
    name: "background",
    label: "Background",
    type: "select",
    category: "Layout",
    default: "default",
    options: options([
      ["default", "Page"],
      ["muted", "Muted"],
      ["card", "Card"],
      ["secondary", "Secondary"],
      ["accent", "Accent"],
      ["primary", "Primary"],
    ]),
  },
  {
    name: "padding",
    label: "Vertical padding",
    type: "select",
    category: "Layout",
    default: "md",
    options: options([
      ["none", "None"],
      ["sm", "Small"],
      ["md", "Medium"],
      ["lg", "Large"],
      ["xl", "Extra large"],
    ]),
  },
  {
    name: "maxWidth",
    label: "Content width",
    type: "select",
    category: "Layout",
    default: "lg",
    options: options([
      ["sm", "Narrow"],
      ["md", "Medium"],
      ["lg", "Wide"],
      ["xl", "Extra wide"],
      ["full", "Full"],
    ]),
  },
]);

/** A full-width band with a centred, width-limited content column; the page's top-level container. */
export function SectionBlockComponent({
  attributes,
  locale,
  defaultLocale,
  children,
  className,
  id,
}: BlockProps) {
  const { background, padding, maxWidth } = fieldsToProps(SECTION_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  return (
    <section
      id={id}
      className={cn(
        "w-full",
        BACKGROUNDS[background] ?? BACKGROUNDS.default,
        PADDINGS[padding] ?? PADDINGS.md,
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6 px-4",
          MAX_WIDTHS[maxWidth] ?? MAX_WIDTHS.lg
        )}
      >
        {children}
      </div>
    </section>
  );
}

export const SectionBlock: BuilderBlockDefinition = {
  type: "section",
  label: "Section",
  category: "Layout",
  icon: "layout-template",
  description: "A full-width band that holds other blocks.",
  fields: [...SECTION_FIELDS],
  defaults: fieldDefaults(SECTION_FIELDS),
  droppable: true,
  component: SectionBlockComponent,
  wrapperStyle: { minHeight: 48 },
};
