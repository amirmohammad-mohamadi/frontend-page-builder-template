import { z } from "zod";
import { createEnv } from "@utils";

/**
 * Every environment variable the admin app reads, validated once at module
 * load. Defaults target the mock API. `NEXT_PUBLIC_*` values must be
 * referenced literally so Next.js can inline them for the browser.
 */
export const env = createEnv(
  z.object({
    NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:4000"),
    INTERNAL_API_BASE_URL: z.url().default("http://localhost:4000"),
    ADMIN_PROXY_PREFIXES: z
      .string()
      .default("/api/v1/admin,/api/v1/examples,/api/v1/pages")
      .transform((value) =>
        value
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean)
      ),
    AUTH_COOKIE_SECURE: z
      .enum(["true", "false", ""])
      .optional()
      .transform((value) => (value === "" || value === undefined ? undefined : value === "true")),
    /** Which page-builder editor the admin app mounts: the bundled Core shell or the Studio SDK host. */
    NEXT_PUBLIC_BUILDER_EDITOR: z.enum(["core", "studio"]).default("core"),
    /**
     * The project's own GrapesJS Studio licence key (https://app.grapesjs.com), needed only
     * for `studio`. Empty by default; set it in `.env`, never in a committed file.
     */
    NEXT_PUBLIC_GRAPESJS_LICENSE_KEY: z.string().trim().default(""),
    /** The public web app's origin, where the builder's Preview opens `/<locale>/preview/<slug>`. */
    NEXT_PUBLIC_WEB_APP_URL: z.url().default("http://localhost:3000"),
  }),
  {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    INTERNAL_API_BASE_URL: process.env.INTERNAL_API_BASE_URL,
    ADMIN_PROXY_PREFIXES: process.env.ADMIN_PROXY_PREFIXES,
    AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
    NEXT_PUBLIC_BUILDER_EDITOR: process.env.NEXT_PUBLIC_BUILDER_EDITOR,
    NEXT_PUBLIC_GRAPESJS_LICENSE_KEY: process.env.NEXT_PUBLIC_GRAPESJS_LICENSE_KEY,
    NEXT_PUBLIC_WEB_APP_URL: process.env.NEXT_PUBLIC_WEB_APP_URL,
  }
);
