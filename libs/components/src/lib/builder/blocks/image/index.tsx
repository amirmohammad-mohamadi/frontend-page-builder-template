import { ImageIcon } from "lucide-react";
import { cn } from "@utils";
import { defineFields, fieldDefaults, fieldsToProps } from "../../fields/to-props";
import { safeUrl } from "../../sanitize/sanitize-html";
import type { BlockProps, BuilderBlockDefinition } from "../../types";
import { options } from "../shared/defaults";

const FITS: Readonly<Record<string, string>> = {
  cover: "object-cover",
  contain: "object-contain",
  none: "object-none",
};

const RADII: Readonly<Record<string, string>> = {
  none: "rounded-none",
  md: "rounded-md",
  lg: "rounded-xl",
  full: "rounded-full",
};

export const IMAGE_FIELDS = defineFields([
  { name: "src", label: "Image", type: "image", category: "Content", accept: "image" },
  {
    name: "alt",
    label: "Alternative text",
    type: "text",
    category: "Content",
    translatable: true,
    placeholder: "Empty: decorative",
  },
  { name: "width", label: "Width (px)", type: "number", category: "Layout", min: 0, step: 1 },
  { name: "height", label: "Height (px)", type: "number", category: "Layout", min: 0, step: 1 },
  {
    name: "fit",
    label: "Fit",
    type: "select",
    category: "Layout",
    default: "cover",
    options: options([
      ["cover", "Cover"],
      ["contain", "Contain"],
      ["none", "Original size"],
    ]),
  },
  {
    name: "radius",
    label: "Corners",
    type: "select",
    category: "Layout",
    default: "lg",
    options: options([
      ["none", "Square"],
      ["md", "Rounded"],
      ["lg", "Rounder"],
      ["full", "Circle"],
    ]),
  },
]);

/**
 * A picture from the media library, drawn as a plain `<img>` (any host, lazy,
 * async decode) with a translatable alt text. Without a source it shows a
 * muted placeholder so the block stays visible on the canvas.
 */
export function ImageBlockComponent({
  attributes,
  locale,
  defaultLocale,
  className,
  id,
}: BlockProps) {
  const { src, alt, width, height, fit, radius } = fieldsToProps(IMAGE_FIELDS, attributes, {
    locale,
    defaultLocale,
  });
  const source = safeUrl(src);
  const radiusClass = RADII[radius] ?? RADII.lg;

  if (!source) {
    return (
      <div
        id={id}
        role="img"
        aria-label={alt || undefined}
        className={cn(
          "bg-muted text-muted-foreground flex aspect-video w-full items-center justify-center",
          radiusClass,
          className
        )}
      >
        <ImageIcon className="size-10" aria-hidden="true" />
      </div>
    );
  }

  const w = width > 0 ? width : undefined;
  const h = height > 0 ? height : undefined;
  return (
    <img
      id={id}
      src={source}
      alt={alt}
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      className={cn("max-w-full", FITS[fit] ?? FITS.cover, radiusClass, className)}
      style={w && h ? { aspectRatio: `${w} / ${h}` } : undefined}
    />
  );
}

export const ImageBlock: BuilderBlockDefinition = {
  type: "image",
  label: "Image",
  category: "Media",
  icon: "image",
  description: "A picture from the media library.",
  fields: [...IMAGE_FIELDS],
  defaults: fieldDefaults(IMAGE_FIELDS),
  component: ImageBlockComponent,
};
