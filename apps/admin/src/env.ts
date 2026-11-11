import { z } from "zod";
import { createEnv } from "@utils";

/** Every environment variable the admin app reads, validated once at module load. Defaults target the mock API. */
export const env = createEnv(
  z.object({
    NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:4000"),
    INTERNAL_API_BASE_URL: z.url().default("http://localhost:4000"),
    ADMIN_PROXY_PREFIXES: z
      .string()
      .default("/api/v1/admin,/api/v1/examples")
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
    ADMIN_PROXY_PREFIXES: process.env.ADMIN_PROXY_PREFIXES,
    AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
  }
);
