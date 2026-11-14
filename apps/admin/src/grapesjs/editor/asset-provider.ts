import { MediaAssetModel, PaginatedResponseModel } from "@models";
import { mediaApi } from "@services";

/** One media-library item in the shape the editor's asset pickers consume. */
export type BuilderAsset = {
  src: string;
  name: string;
  mimeType: string;
  type: "image" | "video";
};

/** One page of media-library items. */
export type BuilderAssetPage = {
  items: BuilderAsset[];
  isLastPage: boolean;
};

/**
 * The editor's view of the media library, independent of any editor shell: the Studio SDK
 * options adapt it to `AssetsConfig`, and the Core shell's picker reads it directly.
 */
export type BuilderAssetProvider = {
  /** Asset kinds this provider lists. */
  types: ("image" | "video")[];
  /** Lists one page of media. `page` is 1-based; `search` is omitted when empty. */
  list: (params: { page: number; search?: string }) => Promise<BuilderAssetPage>;
  /** Uploads one file to the media library and returns it as an asset. */
  upload: (file: File) => Promise<BuilderAsset>;
};

/** Page size the media library is listed with. */
export const MEDIA_PAGE_SIZE = 40;

/** Maps a media-library row to a builder asset; anything that is not a video counts as an image. */
export const toBuilderAsset = (media: MediaAssetModel): BuilderAsset => ({
  src: media.getUrl(),
  name: media.getName(),
  mimeType: media.getMime(),
  type: media.isVideo() ? "video" : "image",
});

/**
 * Backs every `file` trait's Asset Manager (and the Studio SDK's asset panel) with the media
 * library, so authors pick or upload media visually instead of typing URLs. The services layer
 * owns the HTTP: this only maps rows.
 */
export const mediaLibraryAssetProvider: BuilderAssetProvider = {
  types: ["image", "video"],
  list: async ({ page, search }) => {
    const list = await mediaApi.list({ page, per_page: MEDIA_PAGE_SIZE, search });
    const paged = new PaginatedResponseModel(MediaAssetModel, list);
    return {
      items: paged.getItems().map(toBuilderAsset),
      isLastPage: !paged.getPaginate().getHasNextPage(),
    };
  },
  upload: async (file) => toBuilderAsset(new MediaAssetModel(await mediaApi.upload(file))),
};
