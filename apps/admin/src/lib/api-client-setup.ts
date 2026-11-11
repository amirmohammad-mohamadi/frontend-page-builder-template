import { installApiTransport } from "@services";
import { env } from "@/env";

/** Installs the admin app's transport; imported by the root providers and by `instrumentation.ts`. */
installApiTransport({
  publicBaseUrl: env.NEXT_PUBLIC_API_BASE_URL,
  internalBaseUrl: env.INTERNAL_API_BASE_URL,
  proxyPrefixes: env.ADMIN_PROXY_PREFIXES,
});
