/**
 * Route-level access. Maps an admin path prefix to the permission names (any
 * of) an operator needs to see it in navigation and open it. An empty map
 * means every signed-in operator sees everything, which is the template's
 * default; a project fills it in as its backend's permission names become known.
 *
 * Example:
 *   "/examples": ["examples.view"],
 *   "/settings": ["settings.manage"],
 */
export const ROUTE_PERMISSIONS: Record<string, readonly string[]> = {};

/** The permissions a path needs, by its longest matching prefix; `null` when it needs none. */
export function routePermissions(pathname: string): readonly string[] | null {
  let match: readonly string[] | null = null;
  let matchLength = -1;
  for (const [prefix, names] of Object.entries(ROUTE_PERMISSIONS)) {
    if ((pathname === prefix || pathname.startsWith(`${prefix}/`)) && prefix.length > matchLength) {
      match = names;
      matchLength = prefix.length;
    }
  }
  return match && match.length ? match : null;
}

export type AccessDecision = "allowed" | "denied" | "pending";

/**
 * Navigation decision for an any-of list. Nothing required is always allowed.
 * While the session is loading the answer is `pending`; when the backend
 * sends no permissions at all the shell fails open (the API stays the
 * security boundary), while `<Can>` for actions fails closed.
 */
export function decideAccess(
  required: readonly string[] | null,
  status: "loading" | "ready",
  permissions: readonly string[] | undefined
): AccessDecision {
  if (!required || required.length === 0) return "allowed";
  if (status === "loading") return "pending";
  if (permissions === undefined) return "allowed";
  return required.some((name) => permissions.includes(name)) ? "allowed" : "denied";
}
