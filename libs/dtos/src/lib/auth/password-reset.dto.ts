import { z } from "zod";

/** Step one: ask for a reset link or code. */
export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

/** Step two: the token from the link plus the new password. */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    email: z.email(),
    password: z.string().min(8).max(128),
    password_confirmation: z.string(),
  })
  .refine((value) => value.password === value.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
