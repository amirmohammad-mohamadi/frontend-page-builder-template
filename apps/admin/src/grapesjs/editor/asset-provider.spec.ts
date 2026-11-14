import { mediaApi } from "@services";
import { mediaLibraryAssetProvider } from "./asset-provider";

jest.mock("@services", () => ({
  mediaApi: { list: jest.fn(), upload: jest.fn() },
}));

const row = (id: number, mime: string) => ({
  id,
  url: `https://cdn.example/${id}`,
  name: `file-${id}`,
  mime,
  size: 10,
  alt: {},
});

describe("mediaLibraryAssetProvider", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists 40 per page and maps rows, typing by mime", async () => {
    (mediaApi.list as jest.Mock).mockResolvedValue({
      items: [row(1, "video/mp4"), row(2, "image/png")],
      paginate: { currentPage: 3, lastPage: 4, perPage: 40, total: 150 },
    });

    const page = await mediaLibraryAssetProvider.list({ page: 3, search: "hero" });

    expect(mediaApi.list).toHaveBeenCalledWith({ page: 3, per_page: 40, search: "hero" });
    expect(page.items).toEqual([
      { src: "https://cdn.example/1", name: "file-1", mimeType: "video/mp4", type: "video" },
      { src: "https://cdn.example/2", name: "file-2", mimeType: "image/png", type: "image" },
    ]);
    expect(page.isLastPage).toBe(false);
  });

  it("marks the last page and passes an omitted search through as undefined", async () => {
    (mediaApi.list as jest.Mock).mockResolvedValue({
      items: [],
      paginate: { currentPage: 1, lastPage: 1, perPage: 40, total: 0 },
    });

    const page = await mediaLibraryAssetProvider.list({ page: 1 });

    expect(mediaApi.list).toHaveBeenCalledWith({ page: 1, per_page: 40, search: undefined });
    expect(page.isLastPage).toBe(true);
  });

  it("uploads one file and returns it as an asset", async () => {
    (mediaApi.upload as jest.Mock).mockResolvedValue(row(3, "image/webp"));
    const file = { name: "c.webp" } as unknown as File;

    await expect(mediaLibraryAssetProvider.upload(file)).resolves.toEqual({
      src: "https://cdn.example/3",
      name: "file-3",
      mimeType: "image/webp",
      type: "image",
    });
    expect(mediaApi.upload).toHaveBeenCalledWith(file);
  });
});
