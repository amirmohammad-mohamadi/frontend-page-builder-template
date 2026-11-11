/**
 * Backend endpoint paths, grouped by domain. Paths are relative to the API
 * base; the app's transport decides whether a path goes through the BFF
 * proxy (authenticated) or straight to the backend (public).
 *
 * Add a group per domain next to the existing ones; `nx g ./tools/generators:domain`
 * appends one for you. Keep every path here, never inline in an api file.
 */
export const endpoints = {
  auth: {
    /** Same-origin BFF routes the browser calls (see `@services/auth/server`). */
    bff: {
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      me: "/api/auth/me",
      register: "/api/auth/register",
      forgotPassword: "/api/auth/forgot-password",
      resetPassword: "/api/auth/reset-password",
    },
  },
  example: {
    list: "/api/v1/examples",
    byId: (id: number | string) => `/api/v1/examples/${id}`,
  },
} as const;

export type Endpoints = typeof endpoints;
