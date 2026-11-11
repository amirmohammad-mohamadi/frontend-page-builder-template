/**
 * Resolves the backend path a `/api/backend/[...path]` request may forward
 * to, or `null` when it must be refused.
 *
 * Next.js hands the catch-all segments URL-decoded, so an encoded slash
 * (`..%2fadmin`) arrives as one segment that contains `/`, and `fetch`
 * would normalise the dotted path before the backend sees it. The target is
 * therefore rebuilt from segments that are checked one by one, re-encoded,
 * and only then matched against the allow-list.
 *
 * @param segments the decoded catch-all segments (`params.path`)
 * @param prefixes allowed backend path prefixes, e.g. `["/api/v1/me"]`
 */
export function resolveProxyTarget(
  segments: readonly string[],
  prefixes: readonly string[]
): string | null {
  if (segments.length === 0) return null;
  for (const segment of segments) {
    if (segment === "" || segment === "." || segment === "..") return null;
    if (segment.includes("/") || segment.includes("\\")) return null;
  }
  const target = `/${segments.map((s) => encodeURIComponent(s)).join("/")}`;
  // Belt and braces: the URL parser must agree the path is unchanged.
  if (new URL(target, "http://proxy.invalid").pathname !== target) return null;
  const allowed = prefixes.some((prefix) => {
    const clean = prefix.replace(/\/+$/, "");
    return clean !== "" && (target === clean || target.startsWith(`${clean}/`));
  });
  return allowed ? target : null;
}
