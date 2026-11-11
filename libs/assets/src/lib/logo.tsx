import type { SVGProps } from "react";

/**
 * Placeholder brand mark. Replace this file and each app's favicon
 * (apps/web/public/favicon.svg, apps/admin/public/favicon.svg) with the
 * project's own logo; both apps import it from "@assets" only.
 */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path d="M9 22 16 9l7 13H9Z" fill="var(--background, #fff)" />
    </svg>
  );
}
