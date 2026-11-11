import { z } from "zod";

/**
 * Password sign-in. The form and the BFF route both validate with this
 * schema. Another strategy (magic link, OTP, OAuth) adds its own schema here
 * and its own route under `/api/auth/`; see docs/auth.md.
 */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  remember: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
