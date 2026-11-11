/**
 * Runs once when the Next.js server starts (Node and edge runtimes) and
 * installs the transport for route handlers. React Server Components are
 * bundled separately and do not share this module instance, so a server
 * module that calls the API during render (see `lib/page-resolver.ts`)
 * imports `@/lib/api-client-setup` itself; the import is idempotent.
 */
export async function register(): Promise<void> {
  await import("@/lib/api-client-setup");
}
