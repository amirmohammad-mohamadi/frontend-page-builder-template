import type { z } from "zod";

/**
 * Validates environment variables once, at startup, against a Zod schema and
 * returns the typed result. A failing variable throws with every problem
 * listed, so a misconfigured deployment stops at boot instead of failing on
 * the first request that reads the value.
 *
 * `NEXT_PUBLIC_*` values are inlined by Next.js at build time only when read
 * as `process.env.NEXT_PUBLIC_X` literally, so pass them in `values` from the
 * calling module rather than reading `process.env` dynamically here.
 *
 * @example
 * export const env = createEnv(
 *   z.object({ API_BASE_URL: z.url(), DEFAULT_LOCALE: z.string().default("en") }),
 *   { API_BASE_URL: process.env.API_BASE_URL, DEFAULT_LOCALE: process.env.DEFAULT_LOCALE }
 * );
 */
export function createEnv<TSchema extends z.ZodType>(
  schema: TSchema,
  values: Record<string, string | undefined>
): z.infer<TSchema> {
  const result = schema.safeParse(values);
  if (result.success) return result.data;
  const problems = result.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${problems}`);
}
