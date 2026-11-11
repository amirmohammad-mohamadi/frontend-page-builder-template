/**
 * Auth settings shared by the middleware (edge) and the route handlers
 * (Node). Keep this module free of Node-only imports.
 */

/** Session cookie prefix; must differ from the admin app's, since both run on localhost in development. */
export const AUTH_COOKIE_PREFIX = "web";

/** Pages (without locale) that require a session. */
export const PROTECTED_PATHS = ["/account"] as const;

/**
 * Where the backend exposes its auth operations. The BFF posts to these; the
 * browser never sees them. A backend with a different layout changes only
 * this object (and `readAuthPayload` in `server.ts` if its answer differs).
 */
export const AUTH_BACKEND_PATHS = {
  login: "/api/v1/auth/login",
  logout: "/api/v1/auth/logout",
  refresh: "/api/v1/auth/refresh",
  me: "/api/v1/me",
  register: "/api/v1/auth/register",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
} as const;
