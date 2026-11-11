import type { ListPagesQueryDto } from "@dtos";

export const pageQueryKeys = {
  all: ["pages"] as const,
  lists: () => [...pageQueryKeys.all, "list"] as const,
  list: (query: Partial<ListPagesQueryDto>) => [...pageQueryKeys.lists(), query] as const,
  details: () => [...pageQueryKeys.all, "detail"] as const,
  detail: (id: number | string) => [...pageQueryKeys.details(), String(id)] as const,
  /** Everything read by slug (public page and draft preview); invalidated by every page write. */
  bySlugs: () => [...pageQueryKeys.all, "slug"] as const,
  bySlug: (slug: string) => [...pageQueryKeys.bySlugs(), "published", slug] as const,
  preview: (slug: string) => [...pageQueryKeys.bySlugs(), "preview", slug] as const,
};
