"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { CreateExampleDto, ExampleDto, ListExamplesQueryDto, UpdateExampleDto } from "@dtos";
import { ExampleModel, PaginatedResponseModel } from "@models";
import type { ApiClientError } from "../shared/api-errors";
import { useMutation } from "../shared/hooks/use-mutation";
import { useQuery } from "../shared/hooks/use-query";
import type { NormalizedList } from "../shared/types";
import { exampleApi } from "./example.api";
import { exampleQueryKeys } from "./example.query-keys";

/** A page of examples as a `PaginatedResponseModel`, so the UI reads `getItems()` and `getPaginate()`. */
export function useExamples(
  query: Partial<ListExamplesQueryDto> = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery<
    NormalizedList<ExampleDto>,
    ApiClientError,
    PaginatedResponseModel<ExampleDto, ExampleModel>
  >({
    queryKey: exampleQueryKeys.list(query),
    queryFn: () => exampleApi.list(query),
    select: (list) => new PaginatedResponseModel(ExampleModel, list),
    enabled: options.enabled,
  });
}

export function useExample(id: number | string | undefined) {
  return useQuery<ExampleDto, ApiClientError, ExampleModel>({
    queryKey: exampleQueryKeys.detail(id ?? ""),
    queryFn: () => exampleApi.get(id as number | string),
    select: (dto) => new ExampleModel(dto),
    enabled: id !== undefined && id !== "",
  });
}

export function useCreateExample(options: { onSuccess?: (created: ExampleModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExampleDto) => exampleApi.create(data),
    onSuccess: (dto) => {
      void queryClient.invalidateQueries({ queryKey: exampleQueryKeys.lists() });
      options.onSuccess?.(new ExampleModel(dto));
    },
  });
}

export function useUpdateExample(options: { onSuccess?: (updated: ExampleModel) => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: UpdateExampleDto }) =>
      exampleApi.update(id, data),
    onSuccess: (dto) => {
      queryClient.setQueryData(exampleQueryKeys.detail(dto.id), dto);
      void queryClient.invalidateQueries({ queryKey: exampleQueryKeys.lists() });
      options.onSuccess?.(new ExampleModel(dto));
    },
  });
}

export function useDeleteExample(options: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => exampleApi.remove(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: exampleQueryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: exampleQueryKeys.lists() });
      options.onSuccess?.();
    },
  });
}
