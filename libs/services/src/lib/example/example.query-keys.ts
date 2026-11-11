import type { ListExamplesQueryDto } from "@dtos";

export const exampleQueryKeys = {
  all: ["examples"] as const,
  lists: () => [...exampleQueryKeys.all, "list"] as const,
  list: (query: Partial<ListExamplesQueryDto>) => [...exampleQueryKeys.lists(), query] as const,
  details: () => [...exampleQueryKeys.all, "detail"] as const,
  detail: (id: number | string) => [...exampleQueryKeys.details(), String(id)] as const,
};
