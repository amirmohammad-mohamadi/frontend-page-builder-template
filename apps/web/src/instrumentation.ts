/**
 * Runs once when the Next.js server starts (Node and edge runtimes). The
 * transport is installed here so server components and route handlers can
 * use `apiClient` before any client bundle has imported the setup module.
 */
export async function register(): Promise<void> {
  await import("@/lib/api-client-setup");
}
