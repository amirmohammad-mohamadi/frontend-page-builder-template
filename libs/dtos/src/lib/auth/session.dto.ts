import { z } from "zod";

/** The user object the auth routes hand to the browser. Tokens never appear here. */
export const sessionUserSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type SessionUserDto = z.infer<typeof sessionUserSchema>;

/**
 * What the backend's sign-in endpoint must answer for the BFF to open a
 * session: a token pair and the user. A backend that answers differently is
 * mapped onto this shape in the app's `lib/auth/backend.ts`.
 */
export const tokenPairSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  /** Seconds until the access token expires; read from the JWT when absent. */
  expires_in: z.number().int().positive().optional(),
});

export type TokenPairDto = z.infer<typeof tokenPairSchema>;

export const authPayloadSchema = tokenPairSchema.extend({
  user: sessionUserSchema,
});

export type AuthPayloadDto = z.infer<typeof authPayloadSchema>;
