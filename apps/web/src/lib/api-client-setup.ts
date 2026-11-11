import { documentLanguageHeaders, installApiTransport } from "@services";
import { env } from "@/env";

/**
 * Installs the web app's transport for the shared `apiClient`. Imported by
 * the root providers (browser and SSR) and by `instrumentation.ts` (server
 * start), so every runtime has it before the first request.
 */
installApiTransport({
  publicBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  internalBaseUrl: env.INTERNAL_API_BASE_URL,
  proxyPrefixes: env.WEB_PROXY_PREFIXES,
  headers: documentLanguageHeaders,
});
