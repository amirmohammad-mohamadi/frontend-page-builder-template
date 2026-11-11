import type { CreateExampleDto, ExampleDto, ListExamplesQueryDto, UpdateExampleDto } from "@dtos";
import { buildUrlWithQuery, objectToSearchParams } from "@utils";
import { apiClient } from "../shared/api-client";
import { endpoints } from "../shared/endpoints";
import type { NormalizedList } from "../shared/types";

/** The only file in this domain that touches `apiClient`. Hooks call these; components call hooks. */
export const exampleApi = {
  list: (query: Partial<ListExamplesQueryDto> = {}): Promise<NormalizedList<ExampleDto>> =>
    apiClient.getList<ExampleDto>(
      buildUrlWithQuery(endpoints.example.list, objectToSearchParams(query).toString())
    ),

  get: (id: number | string): Promise<ExampleDto> =>
    apiClient.get<ExampleDto>(endpoints.example.byId(id)),

  create: (data: CreateExampleDto): Promise<ExampleDto> =>
    apiClient.post<ExampleDto>(endpoints.example.list, data),

  update: (id: number | string, data: UpdateExampleDto): Promise<ExampleDto> =>
    apiClient.patch<ExampleDto>(endpoints.example.byId(id), data),

  remove: (id: number | string): Promise<void> =>
    apiClient.delete<void>(endpoints.example.byId(id)),
};
