/**
 * Whether the browser reports no network (`navigator.onLine === false`).
 * `false` on the server and wherever the browser does not say: only a
 * definite "offline" counts, since `onLine === true` does not prove the API
 * is reachable.
 */
export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
