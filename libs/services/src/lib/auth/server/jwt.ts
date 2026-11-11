/**
 * Reads the `exp` claim of a JWT without verifying it. The BFF uses it only
 * to size cookie lifetimes and to skip a request that would certainly be
 * rejected; the backend remains the security boundary. Works in Node and on
 * the edge runtime (`atob`, no Buffer).
 */
export function jwtExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** Seconds until the token expires, or `null` when it cannot be read or is already expired. */
export function jwtSecondsToExpiry(token: string): number | null {
  const exp = jwtExpiry(token);
  if (exp === null) return null;
  const seconds = exp - Math.floor(Date.now() / 1000);
  return seconds > 0 ? seconds : null;
}

/** Whether a token's `exp` has passed; `false` when the token has no readable `exp`. */
export function isJwtExpired(token: string): boolean {
  const exp = jwtExpiry(token);
  return exp !== null && exp * 1000 <= Date.now();
}
