import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.email(),
    password: z.string().min(8).max(128),
    password_confirmation: z.string(),
  })
  .refine((value) => value.password === value.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

export type RegisterDto = z.infer<typeof registerSchema>;
