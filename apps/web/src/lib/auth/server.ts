import "server-only";

import { createAuthServer } from "@services/auth/server";
import { env } from "@/env";
import { AUTH_BACKEND_PATHS, AUTH_COOKIE_PREFIX } from "./config";

/**
 * The web app's BFF auth server. Route files under `app/api/auth` and
 * `app/api/backend` re-export its handlers. To support another sign-in
 * strategy, add a route that calls `authServer.credentialHandler({ schema, path })`.
 */
export const authServer = createAuthServer({
  cookiePrefix: AUTH_COOKIE_PREFIX,
  backend: {
    baseUrl: env.INTERNAL_API_BASE_URL,
    paths: AUTH_BACKEND_PATHS,
  },
  proxyPrefixes: env.WEB_PROXY_PREFIXES,
  secureCookies: env.AUTH_COOKIE_SECURE,
});
