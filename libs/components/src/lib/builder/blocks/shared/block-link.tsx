import type { ComponentProps, ReactNode } from "react";
import { textDirection } from "@utils";
import { Button } from "../../../ui/button";
import { safeUrl } from "../../sanitize/sanitize-html";

type ButtonVariant = ComponentProps<typeof Button>["variant"];
type ButtonSize = ComponentProps<typeof Button>["size"];

/** The `variant` choices a block offers, as the shadcn Button names them. */
export const BUTTON_VARIANTS = new Set<string>([
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
]);

/** The `size` choices a block offers. */
export const BUTTON_SIZES = new Set<string>(["default", "sm", "lg"]);

export type BlockLinkProps = {
  href: string;
  label: ReactNode;
  /** Opens in a new tab (with `rel="noopener noreferrer"`). */
  external?: boolean;
  variant?: string;
  size?: string;
  className?: string;
};

/**
 * A link drawn as a shadcn Button, shared by the button, hero and CTA blocks.
 * The href goes through `safeUrl`, so a script URL becomes an inert anchor;
 * the label's text direction is isolated so a Persian label on an English
 * page (or the reverse) keeps its word order.
 */
export function BlockLink({ href, label, external, variant, size, className }: BlockLinkProps) {
  const target = safeUrl(href) ?? "#";
  const safeVariant = (
    variant && BUTTON_VARIANTS.has(variant) ? variant : "default"
  ) as ButtonVariant;
  const safeSize = (size && BUTTON_SIZES.has(size) ? size : "default") as ButtonSize;
  const text = typeof label === "string" ? label : undefined;

  return (
    <Button asChild variant={safeVariant} size={safeSize} className={className}>
      <a
        href={target}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        dir={textDirection(text)}
      >
        {label}
      </a>
    </Button>
  );
}
