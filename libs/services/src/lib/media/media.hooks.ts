"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ListMediaQueryDto, MediaAssetDto, UpdateMediaAssetDto } from "@dtos";
import { MediaAssetModel, PaginatedResponseModel } from "@models";
import type { ApiClientError } from "../shared/api-errors";
import { useMutation } from "../shared/hooks/use-mutation";
import { useQuery } from "../shared/hooks/use-query";
import type { NormalizedList } from "../shared/types";
import { mediaApi } from "./media.api";
import { mediaQueryKeys } from "./media.query-keys";

/** A page of media assets as a `PaginatedResponseModel`, so the UI reads `getItems()` and `getPaginate()`. */
export function useMediaAssets(
  query: Partial<ListMediaQueryDto> = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery<
    NormalizedList<MediaAssetDto>,
    ApiClientError,
    PaginatedResponseModel<MediaAssetDto, MediaAssetModel>
  >({
    queryKey: mediaQueryKeys.list(query),
    queryFn: () => mediaApi.list(query),
    select: (list) => new PaginatedResponseModel(MediaAssetModel, list),
    enabled: options.enabled,
  });
}

export function useMediaAsset(id: number | string | undefined) {
  return useQuery<MediaAssetDto, ApiClientError, MediaAssetModel>({
    queryKey: mediaQueryKeys.detail(id ?? ""),
    queryFn: () => mediaApi.get(id as number | string),
    select: (dto) => new MediaAssetModel(dto),
    enabled: id !== undefined && id !== "",
  });
}

/** Uploads one file; pass `{ file, name }` to the mutation. */
export function useUploadMedia(options: { onSuccess?: (uploaded: MediaAssetModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: File | Blob; name?: string }) =>
      mediaApi.upload(file, name),
    onSuccess: (dto) => {
      queryClient.setQueryData(mediaQueryKeys.detail(dto.id), dto);
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      options.onSuccess?.(new MediaAssetModel(dto));
    },
  });
}

export function useUpdateMediaAsset(
  options: { onSuccess?: (updated: MediaAssetModel) => void } = {}
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateMediaAssetDto }) =>
      mediaApi.update(id, data),
    onSuccess: (dto) => {
      queryClient.setQueryData(mediaQueryKeys.detail(dto.id), dto);
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      options.onSuccess?.(new MediaAssetModel(dto));
    },
  });
}

export function useDeleteMediaAsset(options: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => mediaApi.remove(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: mediaQueryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: mediaQueryKeys.lists() });
      options.onSuccess?.();
    },
  });
}
