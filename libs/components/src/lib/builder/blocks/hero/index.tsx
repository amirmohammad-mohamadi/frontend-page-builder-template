import { cn, textDirection } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import { safeUrl } from "../../sanitize/sanitize-html";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { BlockLink } from "../shared/block-link";
import { options, sample } from "../shared/defaults";

export const HERO_FIELDS = defineFields([
  {
    name: "title",
    label: "Title",
    type: "text",
    category: "Content",
    translatable: true,
    default: sample("Build pages visually", "صفحه‌ها را به‌صورت دیداری بسازید"),
  },
  {
    name: "subtitle",
    label: "Subtitle",
    type: "textarea",
    category: "Content",
    translatable: true,
    default: sample(
      "Drag blocks onto the canvas, edit their settings and publish in every language.",
      "بلوک‌ها را به بوم بکشید، تنظیمات را ویرایش کنید و در هر زبان منتشر کنید."
    ),
  },
  { name: "image", label: "Image", type: "image", category: "Media", accept: "image" },
  {
    name: "imageAlt",
    label: "Image alternative text",
    type: "text",
    category: "Media",
    translatable: true,
    placeholder: "Empty: decorative",
  },
  {
    name: "primaryLabel",
    label: "Primary button",
    type: "text",
    category: "Buttons",
    translatable: true,
    default: sample("Get started", "شروع کنید"),
  },
  { name: "primaryHref", label: "Primary link", type: "href", category: "Buttons", default: "#" },
  {
    name: "secondaryLabel",
    label: "Secondary button",
    type: "text",
    category: "Buttons",
    translatable: true,
    default: sample("Read the guide", "راهنما را بخوانید"),
  },
  {
    name: "secondaryHref",
    label: "Secondary link",
    type: "href",
    category: "Buttons",
    default: "#",
  },
  {
    name: "align",
    label: "Alignment",
    type: "select",
    category: "Layout",
    default: "start",
    options: options([
      ["start", "Start"],
      ["center", "Center"],
    ]),
  },
]);

/**
 * The page opener: a title, a subtitle, up to two buttons and an optional
 * picture beside them (below them on phones, centred layouts stack it).
 */
export function HeroBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const p = fieldsToProps(HERO_FIELDS, attributes, { locale, defaultLocale });
  const image = safeUrl(p.image);
  const centered = p.align === "center" || !image;
  const hasButtons = Boolean(p.primaryLabel || p.secondaryLabel);

  return (
    <section
      id={id}
      className={cn(
        "mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:py-24",
        image && !centered && "md:grid-cols-2",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-6",
          centered ? "items-center text-center" : "items-start text-start"
        )}
      >
        <h1
          dir={textDirection(p.title)}
          className="text-4xl font-bold tracking-tight text-balance md:text-6xl"
        >
          {p.title}
        </h1>
        {p.subtitle ? (
          <p
            dir={textDirection(p.subtitle)}
            className="text-muted-foreground max-w-prose text-lg text-pretty md:text-xl"
          >
            {p.subtitle}
          </p>
        ) : null}
        {hasButtons ? (
          <div className={cn("flex flex-wrap gap-3", centered && "justify-center")}>
            {p.primaryLabel ? (
              <BlockLink href={p.primaryHref} label={p.primaryLabel} size="lg" />
            ) : null}
            {p.secondaryLabel ? (
              <BlockLink
                href={p.secondaryHref}
                label={p.secondaryLabel}
                variant="outline"
                size="lg"
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {image ? (
        <img
          src={image}
          alt={p.imageAlt}
          loading="eager"
          decoding="async"
          className={cn(
            "w-full rounded-xl object-cover",
            centered ? "max-h-[28rem]" : "aspect-[4/3]"
          )}
        />
      ) : null}
    </section>
  );
}

export const HeroBlock: BuilderBlockDefinition = {
  type: "hero",
  label: "Hero",
  category: "Marketing",
  icon: "sparkles",
  description: "A page opener with a title, a subtitle, buttons and a picture.",
  fields: [...HERO_FIELDS],
  defaults: fieldDefaults(HERO_FIELDS),
  component: HeroBlockComponent,
};
