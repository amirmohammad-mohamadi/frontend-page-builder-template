/**
 * Sanitizes a page's authored CSS so it is safe to place inside a `<style>`
 * element. A `<style>` is a raw-text element: the browser ends it at the first
 * literal `</style`, so `body{}</style><script>…` would break out into HTML
 * and run. React's escaping does not apply there, so the only defence is to
 * make sure the text can hold no tag delimiter, and to strip the handful of
 * CSS constructs that fetch or execute by themselves.
 *
 * Guarantees on the result:
 *  - no `<` or `>` (so no `</style>` breakout or tag injection);
 *  - no `@import` (would fetch a stylesheet the author controls);
 *  - no legacy `expression(…)` or `behavior:` (ran script in old engines);
 *  - no `url(…)` pointing at `javascript:`, `vbscript:` or a non-image `data:` target.
 * Ordinary styling (selectors, declarations, media queries, plain `url()`
 * references to images) comes through unchanged.
 *
 * @param css the authored CSS (anything falsy gives `""`)
 */
export function sanitizeCss(css?: string | null): string {
  if (!css || typeof css !== "string") return "";

  let out = css.replace(/[<>]/g, "");
  out = out.replace(/@import\b[^;]*;?/gi, "");
  out = out.replace(/expression\s*\(/gi, "void(");
  out = out.replace(/(-[a-z]+-)?behaviou?r\s*:/gi, "/*behavior*/:");
  out = out.replace(
    // The target may hold one level of parentheses (`javascript:alert(1)`).
    /url\(\s*(['"]?)((?:[^()'"]|\([^()]*\))*)\1\s*\)/gi,
    (match: string, _quote: string, rawTarget: string) => {
      const target = String(rawTarget)
        .replace(/\/\*[^]*?\*\//g, "")
        .replace(/\s+/g, "")
        .toLowerCase();
      if (target.startsWith("javascript:") || target.startsWith("vbscript:")) return "url()";
      if (target.startsWith("data:")) return target.startsWith("data:image/") ? match : "url()";
      return match;
    }
  );
  return out;
}
