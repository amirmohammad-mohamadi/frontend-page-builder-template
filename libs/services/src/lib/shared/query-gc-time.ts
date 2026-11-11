const BROWSER_QUERY_GC_TIME = 10 * 60 * 1000;

/**
 * The `gcTime` default of every query: 10 minutes in the browser, `Infinity`
 * on the server. A finite value makes TanStack Query start a timer per query
 * during server rendering, and each timer keeps that request's memory alive
 * until it fires; a server-side client lives only as long as its request, so
 * it needs no garbage collection.
 */
export function queryGcTime(): number {
  return typeof window === "undefined" ? Infinity : BROWSER_QUERY_GC_TIME;
}
