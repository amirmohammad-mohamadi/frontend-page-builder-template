import type { ListMediaQueryDto } from "@dtos";

export const mediaQueryKeys = {
  all: ["media"] as const,
  lists: () => [...mediaQueryKeys.all, "list"] as const,
  list: (query: Partial<ListMediaQueryDto>) => [...mediaQueryKeys.lists(), query] as const,
  details: () => [...mediaQueryKeys.all, "detail"] as const,
  detail: (id: number | string) => [...mediaQueryKeys.details(), String(id)] as const,
};
