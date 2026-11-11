import "server-only";

import { createAuthServer } from "@services/auth/server";
import { env } from "@/env";
import { AUTH_BACKEND_PATHS, AUTH_COOKIE_PREFIX } from "./config";

/** The admin app's BFF auth server; route files re-export its handlers. */
export const authServer = createAuthServer({
  cookiePrefix: AUTH_COOKIE_PREFIX,
  backend: {
    baseUrl: env.INTERNAL_API_BASE_URL,
    paths: AUTH_BACKEND_PATHS,
  },
  proxyPrefixes: env.ADMIN_PROXY_PREFIXES,
  secureCookies: env.AUTH_COOKIE_SECURE,
});
