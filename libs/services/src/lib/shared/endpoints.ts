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
  /** Builder pages: the admin CRUD plus the public read by slug and the signed-in draft preview. */
  page: {
    list: "/api/v1/admin/pages",
    byId: (id: number | string) => `/api/v1/admin/pages/${id}`,
    publish: (id: number | string) => `/api/v1/admin/pages/${id}/publish`,
    unpublish: (id: number | string) => `/api/v1/admin/pages/${id}/unpublish`,
    /** Public; a slug may contain `/`, so each segment is encoded on its own. */
    bySlug: (slug: string) => `/api/v1/pages/${encodeSlug(slug)}`,
    /** The draft of a page, for a signed-in operator; goes through the BFF proxy. */
    preview: (slug: string) => `/api/v1/pages/${encodeSlug(slug)}/preview`,
  },
  /** Media library. `POST list` is a multipart upload with the file under the `file` field. */
  media: {
    list: "/api/v1/admin/media",
    byId: (id: number | string) => `/api/v1/admin/media/${id}`,
  },
} as const;

/** Encodes a page slug segment by segment, keeping its `/` separators. */
function encodeSlug(slug: string): string {
  return slug.split("/").map(encodeURIComponent).join("/");
}

export type Endpoints = typeof endpoints;
