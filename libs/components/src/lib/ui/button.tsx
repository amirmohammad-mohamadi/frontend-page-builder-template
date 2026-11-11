import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // `bg-brand-600` (absolute) rather than `bg-brand` (theme-aware ink):
        // this fill carries white text (5.6:1), and in the dark theme
        // `--brand` is lifted too light for that. See --brand.
        default: "bg-brand-600 text-brand-foreground shadow-xs hover:bg-brand-600/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-brand underline-offset-4 hover:underline",
        // v2 text CTA (Nova Ghost): label and icon in the brand ink, which
        // keeps AA on the dark background where `--primary` would not.
        "ghost-primary": "text-brand hover:bg-accent hover:text-brand dark:hover:bg-accent/50",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        // v2 Nova sizes (page-builder v2, SPEC D6): radius 10, padding 10,
        // gap 6. The sizes above stay as they are for the dashboard.
        nova: "h-9 gap-1.5 rounded-control px-2.5",
        "nova-sm": "h-8 gap-1.5 rounded-control px-2.5",
        "nova-lg": "h-10 gap-1.5 rounded-control px-3",
        "nova-icon": "size-9 rounded-control",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // An icon-only button shows no text, so its `aria-label` is the only
  // description of what it does — screen readers get it, sighted users are
  // left guessing between a shield, a pencil and an external-link glyph. The
  // admin has 37 of these across 46 files. Mirroring the label into `title`
  // gives every one of them a hover tooltip without touching a call site, and
  // without the layout/portal cost of a Tooltip component on every row.
  // An explicit `title` always wins.
  const iconOnly = size === "icon" || size === "nova-icon";
  const title =
    props.title ??
    (iconOnly && typeof props["aria-label"] === "string" ? props["aria-label"] : undefined);

  return (
    <Comp
      data-slot="button"
      data-icon={iconOnly ? "" : undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      title={title}
    />
  );
}

export { Button, buttonVariants };
