import { cn, textDirection } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { BlockLink } from "../shared/block-link";
import { options, sample } from "../shared/defaults";

/** Tone → banner surface and the button variant that contrasts with it. */
const TONES: Readonly<Record<string, { surface: string; button: string }>> = {
  primary: { surface: "bg-primary text-primary-foreground", button: "secondary" },
  muted: { surface: "bg-muted text-foreground", button: "default" },
  accent: { surface: "bg-accent text-accent-foreground", button: "default" },
  outline: { surface: "border bg-card text-card-foreground", button: "default" },
};

export const CTA_BANNER_FIELDS = defineFields([
  {
    name: "title",
    label: "Title",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Ready to start?", "آماده شروع هستید؟"),
  },
  {
    name: "body",
    label: "Body",
    type: "textarea",
    category: "Content",
    translatable: true,
    default: sample(
      "Create your first page in a few minutes.",
      "نخستین صفحه خود را در چند دقیقه بسازید."
    ),
  },
  {
    name: "buttonLabel",
    label: "Button label",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Create a page", "ایجاد صفحه"),
  },
  { name: "buttonHref", label: "Button link", type: "href", category: "Content", default: "#" },
  {
    name: "tone",
    label: "Tone",
    type: "select",
    category: "Layout",
    default: "primary",
    options: options([
      ["primary", "Primary"],
      ["muted", "Muted"],
      ["accent", "Accent"],
      ["outline", "Outlined"],
    ]),
  },
]);

/** A call-to-action band: a title, a line of text and one button. */
export function CtaBannerBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { title, body, buttonLabel, buttonHref, tone } = fieldsToProps(
    CTA_BANNER_FIELDS,
    attributes,
    {
      locale,
      defaultLocale,
    }
  );
  const look = TONES[tone] ?? TONES.primary;
  return (
    <div
      id={id}
      className={cn(
        "flex flex-col items-start gap-6 rounded-xl px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12",
        look.surface,
        className
      )}
    >
      <div className="flex flex-col gap-2 text-start">
        <h2
          dir={textDirection(title)}
          className="text-2xl font-semibold tracking-tight text-balance md:text-3xl"
        >
          {title}
        </h2>
        {body ? (
          <p dir={textDirection(body)} className="max-w-prose text-base opacity-90 md:text-lg">
            {body}
          </p>
        ) : null}
      </div>
      {buttonLabel ? (
        <BlockLink
          href={buttonHref}
          label={buttonLabel}
          variant={look.button}
          size="lg"
          className="shrink-0"
        />
      ) : null}
    </div>
  );
}

export const CtaBannerBlock: BuilderBlockDefinition = {
  type: "cta-banner",
  label: "Call to action",
  category: "Marketing",
  icon: "megaphone",
  description: "A coloured band with a title, a line and one button.",
  fields: [...CTA_BANNER_FIELDS],
  defaults: fieldDefaults(CTA_BANNER_FIELDS),
  component: CtaBannerBlockComponent,
};
