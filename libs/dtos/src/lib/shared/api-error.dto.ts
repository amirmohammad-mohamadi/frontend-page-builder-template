import { z } from "zod";

/**
 * The error body the frontend understands, whatever the backend sent: the
 * services layer's backend adapter maps the raw body onto this. `errors` is
 * keyed by field name.
 */
export const apiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number().int().optional(),
  code: z.union([z.number(), z.string()]).optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ApiErrorDto = z.infer<typeof apiErrorSchema>;
