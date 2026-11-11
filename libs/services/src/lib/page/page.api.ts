import type { CreatePageDto, ListPagesQueryDto, PageDto, UpdatePageDto } from "@dtos";
import { buildUrlWithQuery, objectToSearchParams } from "@utils";
import { apiClient } from "../shared/api-client";
import { endpoints } from "../shared/endpoints";
import type { NormalizedList } from "../shared/types";

/**
 * The only file in this domain that touches `apiClient`. The admin calls go
 * through the authenticated proxy; `getBySlug` is public and `getPreview`
 * needs a session (the proxy adds it). Hooks call these; components call hooks.
 */
export const pageApi = {
  list: (query: Partial<ListPagesQueryDto> = {}): Promise<NormalizedList<PageDto>> =>
    apiClient.getList<PageDto>(
      buildUrlWithQuery(endpoints.page.list, objectToSearchParams(query).toString())
    ),

  get: (id: number | string): Promise<PageDto> => apiClient.get<PageDto>(endpoints.page.byId(id)),

  create: (data: CreatePageDto): Promise<PageDto> =>
    apiClient.post<PageDto>(endpoints.page.list, data),

  /** Saves the slug, title, SEO fields or the draft content; never the published copy. */
  update: (id: number | string, data: UpdatePageDto): Promise<PageDto> =>
    apiClient.patch<PageDto>(endpoints.page.byId(id), data),

  /** Copies the draft to `published` and stamps `published_at`. */
  publish: (id: number | string): Promise<PageDto> =>
    apiClient.post<PageDto>(endpoints.page.publish(id)),

  /** Clears `published`; the public app answers 404 for the slug afterwards. */
  unpublish: (id: number | string): Promise<PageDto> =>
    apiClient.post<PageDto>(endpoints.page.unpublish(id)),

  remove: (id: number | string): Promise<void> => apiClient.delete<void>(endpoints.page.byId(id)),

  /** The published page by slug (public). Rejects with a 404 `ApiClientError` while unpublished. */
  getBySlug: (slug: string): Promise<PageDto> =>
    apiClient.get<PageDto>(endpoints.page.bySlug(slug)),

  /** The page with its draft, for a signed-in operator's preview. */
  getPreview: (slug: string): Promise<PageDto> =>
    apiClient.get<PageDto>(endpoints.page.preview(slug)),
};
