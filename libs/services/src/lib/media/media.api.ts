import type { ListMediaQueryDto, MediaAssetDto, UpdateMediaAssetDto } from "@dtos";
import { buildUrlWithQuery, objectToSearchParams } from "@utils";
import { apiClient } from "../shared/api-client";
import { endpoints } from "../shared/endpoints";
import type { NormalizedList } from "../shared/types";

/** The only file in this domain that touches `apiClient`. Every call goes through the admin proxy. */
export const mediaApi = {
  list: (query: Partial<ListMediaQueryDto> = {}): Promise<NormalizedList<MediaAssetDto>> =>
    apiClient.getList<MediaAssetDto>(
      buildUrlWithQuery(endpoints.media.list, objectToSearchParams(query).toString())
    ),

  get: (id: number | string): Promise<MediaAssetDto> =>
    apiClient.get<MediaAssetDto>(endpoints.media.byId(id)),

  /**
   * Uploads one file as `multipart/form-data` with the bytes under `file` and
   * an optional display `name`. A `Blob` without a name is sent as `name` or
   * `"file"`; a `File` keeps its own name unless `name` overrides it.
   */
  upload: (file: File | Blob, name?: string): Promise<MediaAssetDto> => {
    const formData = new FormData();
    const fileName = name ?? (file instanceof File ? file.name : "file");
    formData.append("file", file, fileName);
    if (name) formData.append("name", name);
    return apiClient.upload<MediaAssetDto>(endpoints.media.list, formData);
  },

  update: (id: number | string, data: UpdateMediaAssetDto): Promise<MediaAssetDto> =>
    apiClient.patch<MediaAssetDto>(endpoints.media.byId(id), data),

  remove: (id: number | string): Promise<void> => apiClient.delete<void>(endpoints.media.byId(id)),
};
