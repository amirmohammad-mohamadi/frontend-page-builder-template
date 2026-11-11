/** Builds `URLSearchParams` from an object, skipping `null` and `undefined` values. */
export function objectToSearchParams(
  params: Record<string, string | number | boolean | null | undefined>
): URLSearchParams {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) searchParams.append(key, String(value));
  }
  return searchParams;
}

/** Appends a query string to a path; returns the path alone when the query is empty. */
export function buildUrlWithQuery(basePath: string, queryString: string): string {
  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Prefixes a root-relative path with a locale segment: `/about` on `fa`
 * becomes `/fa/about`, `/` becomes `/fa`. Returned unchanged: absolute and
 * protocol-relative URLs, anchors, `mailto:`/`tel:` links, relative paths,
 * paths that already start with one of `locales`, and non-page paths
 * (`/api/…`, `/_next/…`, or a file with an extension).
 */
export function localizeHref(href: string, locale: string, locales: readonly string[]): string {
  if (!href || !locale || !href.startsWith("/") || href.startsWith("//")) return href;
  const path = href.split(/[?#]/, 1)[0];
  const first = path.split("/", 2)[1] ?? "";
  if (locales.includes(first) || first === "api" || first === "_next") return href;
  if (/\.[a-z0-9]+$/i.test(path.slice(path.lastIndexOf("/") + 1))) return href;
  return path === "/" ? `/${locale}${href.slice(1)}` : `/${locale}${href}`;
}

/**
 * Swaps the locale segment of a localized pathname: `/en/about` on `fa`
 * becomes `/fa/about`. A pathname without a known locale segment is prefixed.
 */
export function switchLocaleInPath(
  pathname: string,
  locale: string,
  locales: readonly string[]
): string {
  const [, first = "", ...rest] = pathname.split("/");
  if (locales.includes(first))
    return `/${[locale, ...rest].join("/")}`.replace(/\/$/, "") || `/${locale}`;
  return localizeHref(pathname, locale, locales);
}
