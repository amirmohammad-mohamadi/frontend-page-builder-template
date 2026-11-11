import { z } from "zod";
import { listQuerySchema } from "../shared/pagination.dto";

/**
 * The `example` domain exists only to prove every layer end to end (DTO,
 * model, api, hooks, pages, mock API, generator). Delete it with
 * `npm run example:remove` once the first real domain exists.
 */
export const exampleStatusSchema = z.enum(["draft", "active", "archived"]);

export const exampleSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  description: z.string().nullable(),
  status: exampleStatusSchema,
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export type ExampleDto = z.infer<typeof exampleSchema>;

export const createExampleSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  status: exampleStatusSchema,
});

export type CreateExampleDto = z.infer<typeof createExampleSchema>;

export const updateExampleSchema = createExampleSchema.partial();

export type UpdateExampleDto = z.infer<typeof updateExampleSchema>;

export const listExamplesQuerySchema = listQuerySchema.extend({
  status: exampleStatusSchema.optional(),
});

export type ListExamplesQueryDto = z.infer<typeof listExamplesQuerySchema>;
