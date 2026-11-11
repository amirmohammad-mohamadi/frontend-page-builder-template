import { z } from "zod";
import { SortDirection } from "@enums";

/** Query parameters of every paginated list request. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQueryDto = z.infer<typeof paginationQuerySchema>;

/** A paginated list request with an optional free-text search and sort. */
export const listQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(200).optional(),
  sort: z.string().max(100).optional(),
  direction: z.enum([SortDirection.Asc, SortDirection.Desc]).optional(),
});

export type ListQueryDto = z.infer<typeof listQuerySchema>;
