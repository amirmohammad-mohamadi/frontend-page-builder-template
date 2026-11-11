/** Shared by the middleware (edge) and the route handlers (Node); no Node-only imports here. */

/** Differs from the web app's prefix: both apps run on localhost in development and cookies ignore the port. */
export const AUTH_COOKIE_PREFIX = "admin";

/** Pages a signed-out operator may open. */
export const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"] as const;

/** Where the backend exposes operator auth. Change here when the backend differs. */
export const AUTH_BACKEND_PATHS = {
  login: "/api/v1/admin/auth/login",
  logout: "/api/v1/admin/auth/logout",
  refresh: "/api/v1/admin/auth/refresh",
  me: "/api/v1/admin/me",
  forgotPassword: "/api/v1/admin/auth/forgot-password",
  resetPassword: "/api/v1/admin/auth/reset-password",
} as const;
