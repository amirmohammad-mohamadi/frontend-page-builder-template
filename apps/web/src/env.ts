import { z } from "zod";
import { createEnv } from "@utils";
import { LOCALES } from "@/i18n/locales";

/**
 * Every environment variable the web app reads, validated once at module
 * load. `NEXT_PUBLIC_*` values must be referenced literally so Next.js can
 * inline them for the browser. Everything has a local-development default,
 * so a fresh clone runs against the bundled mock API with no `.env`.
 */
export const env = createEnv(
  z.object({
    NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:4000"),
    INTERNAL_API_BASE_URL: z.url().default("http://localhost:4000"),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(LOCALES).default(LOCALES[0]),
    NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
    WEB_PROXY_PREFIXES: z
      .string()
      .default("/api/v1/me,/api/v1/examples")
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
  }),
  {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    INTERNAL_API_BASE_URL: process.env.INTERNAL_API_BASE_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    WEB_PROXY_PREFIXES: process.env.WEB_PROXY_PREFIXES,
    AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
  }
);
