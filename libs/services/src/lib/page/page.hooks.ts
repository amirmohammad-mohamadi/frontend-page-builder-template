"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { CreatePageDto, ListPagesQueryDto, PageDto, UpdatePageDto } from "@dtos";
import { PageModel, PaginatedResponseModel } from "@models";
import type { ApiClientError } from "../shared/api-errors";
import { useMutation } from "../shared/hooks/use-mutation";
import { useQuery } from "../shared/hooks/use-query";
import type { NormalizedList } from "../shared/types";
import { pageApi } from "./page.api";
import { pageQueryKeys } from "./page.query-keys";

type PageQueryOptions = { enabled?: boolean };

/** Writes the saved record into its detail query and drops every list and by-slug read. */
function settlePage(queryClient: QueryClient, dto: PageDto): void {
  queryClient.setQueryData(pageQueryKeys.detail(dto.id), dto);
  void queryClient.invalidateQueries({ queryKey: pageQueryKeys.lists() });
  void queryClient.invalidateQueries({ queryKey: pageQueryKeys.bySlugs() });
}

/** A page of builder pages as a `PaginatedResponseModel`, so the UI reads `getItems()` and `getPaginate()`. */
export function usePages(query: Partial<ListPagesQueryDto> = {}, options: PageQueryOptions = {}) {
  return useQuery<
    NormalizedList<PageDto>,
    ApiClientError,
    PaginatedResponseModel<PageDto, PageModel>
  >({
    queryKey: pageQueryKeys.list(query),
    queryFn: () => pageApi.list(query),
    select: (list) => new PaginatedResponseModel(PageModel, list),
    enabled: options.enabled,
  });
}

/** One page by id, with its draft, for the editor. */
export function usePage(id: number | string | undefined) {
  return useQuery<PageDto, ApiClientError, PageModel>({
    queryKey: pageQueryKeys.detail(id ?? ""),
    queryFn: () => pageApi.get(id as number | string),
    select: (dto) => new PageModel(dto),
    enabled: id !== undefined && id !== "",
  });
}

/**
 * The published page by slug, for the public app. A 404 (unpublished or
 * unknown slug) surfaces as `error.statusCode === 404`; render not-found then.
 */
export function usePageBySlug(slug: string | undefined, options: PageQueryOptions = {}) {
  return useQuery<PageDto, ApiClientError, PageModel>({
    queryKey: pageQueryKeys.bySlug(slug ?? ""),
    queryFn: () => pageApi.getBySlug(slug as string),
    select: (dto) => new PageModel(dto),
    enabled: (options.enabled ?? true) && slug !== undefined && slug !== "",
  });
}

/** The page with its draft, for a signed-in operator's preview. Not cached beyond the request. */
export function usePagePreview(slug: string | undefined, options: PageQueryOptions = {}) {
  return useQuery<PageDto, ApiClientError, PageModel>({
    queryKey: pageQueryKeys.preview(slug ?? ""),
    queryFn: () => pageApi.getPreview(slug as string),
    select: (dto) => new PageModel(dto),
    enabled: (options.enabled ?? true) && slug !== undefined && slug !== "",
    staleTime: 0,
  });
}

export function useCreatePage(options: { onSuccess?: (created: PageModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePageDto) => pageApi.create(data),
    onSuccess: (dto) => {
      settlePage(queryClient, dto);
      options.onSuccess?.(new PageModel(dto));
    },
  });
}

export function useUpdatePage(options: { onSuccess?: (updated: PageModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdatePageDto }) =>
      pageApi.update(id, data),
    onSuccess: (dto) => {
      settlePage(queryClient, dto);
      options.onSuccess?.(new PageModel(dto));
    },
  });
}

export function usePublishPage(options: { onSuccess?: (published: PageModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => pageApi.publish(id),
    onSuccess: (dto) => {
      settlePage(queryClient, dto);
      options.onSuccess?.(new PageModel(dto));
    },
  });
}

export function useUnpublishPage(options: { onSuccess?: (unpublished: PageModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => pageApi.unpublish(id),
    onSuccess: (dto) => {
      settlePage(queryClient, dto);
      options.onSuccess?.(new PageModel(dto));
    },
  });
}

export function useDeletePage(options: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => pageApi.remove(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: pageQueryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.bySlugs() });
      options.onSuccess?.();
    },
  });
}
