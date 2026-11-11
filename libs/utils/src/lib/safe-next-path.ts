const FALLBACK_PATH = "/";

/**
 * The redirect after signing in. A `next` query parameter is attacker
 * controlled (anyone can send a `/login?next=…` link), so it may only point
 * at a path on the same origin. Returns `value` when it is a same-origin
 * relative path (one leading `/`, not `//` or `/\`, resolving to `origin`);
 * anything else becomes `/`. Pure: the origin is a parameter, so it runs on
 * the server, in the browser and in tests.
 */
export function getSafeNextPath(value: string | null | undefined, origin: string): string {
  if (!value || !value.startsWith("/")) return FALLBACK_PATH;
  if (value.startsWith("//") || value.startsWith("/\\")) return FALLBACK_PATH;
  try {
    // The URL parser drops tabs and newlines and reads `\` as `/`, so a value
    // that looks harmless (`/<TAB>/example.org`) can still leave the origin.
    const expectedOrigin = new URL(origin).origin;
    return new URL(value, expectedOrigin).origin === expectedOrigin ? value : FALLBACK_PATH;
  } catch {
    return FALLBACK_PATH;
  }
}
