/** Runs once at server start; installs the transport for server-side `apiClient` calls. */
export async function register(): Promise<void> {
  await import("@/lib/api-client-setup");
}
