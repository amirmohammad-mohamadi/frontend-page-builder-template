import { ApiClientError, pageApi } from "@services";
import { resolvePublishedPageUncached } from "./page-resolver";
import { publishedPagePath, toPageSlug } from "./page-slug";

jest.mock("@services", () => {
  const actual = jest.requireActual("@services");
  return { ...actual, pageApi: { ...actual.pageApi, getBySlug: jest.fn() } };
});

const getBySlug = pageApi.getBySlug as jest.Mock;

const publishedPage = {
  id: 1,
  slug: "about",
  status: "published",
  title: { en: "About us", fa: "درباره ما" },
  draft: { components: [{ type: "section" }], styles: [] },
  published: { components: [{ type: "section" }], styles: [], css: "" },
  published_at: "2026-01-15T09:00:00.000Z",
};

describe("toPageSlug", () => {
  it("joins segments with a slash", () => {
    expect(toPageSlug(["about"])).toBe("about");
    expect(toPageSlug(["help", "getting-started"])).toBe("help/getting-started");
  });

  it("rejects what cannot be a slug", () => {
    expect(toPageSlug(undefined)).toBeNull();
    expect(toPageSlug([])).toBeNull();
    expect(toPageSlug(["About"])).toBeNull();
    expect(toPageSlug(["a b"])).toBeNull();
    expect(toPageSlug(["..", "admin"])).toBeNull();
    expect(toPageSlug(["about-"])).toBeNull();
    expect(toPageSlug(["", "about"])).toBeNull();
    expect(toPageSlug([" about"])).toBeNull();
    expect(toPageSlug(["x".repeat(201)])).toBeNull();
    expect(toPageSlug(["x".repeat(200)])).toBe("x".repeat(200));
  });

  it("rejects a slug that ends in the reserved preview segment", () => {
    expect(toPageSlug(["about", "preview"])).toBeNull();
    expect(toPageSlug(["preview"])).toBeNull();
    expect(toPageSlug(["preview", "about"])).toBe("preview/about");
  });

  it("builds the public path without a locale", () => {
    expect(publishedPagePath("help/getting-started")).toBe("/help/getting-started");
  });
});

describe("resolvePublishedPageUncached", () => {
  beforeEach(() => getBySlug.mockReset());

  it("never calls the backend for an invalid slug", async () => {
    await expect(resolvePublishedPageUncached(["Not A Slug"])).resolves.toEqual({
      status: "not-found",
    });
    expect(getBySlug).not.toHaveBeenCalled();
  });

  it("returns the page model for a published page", async () => {
    getBySlug.mockResolvedValue(publishedPage);
    const result = await resolvePublishedPageUncached(["about"]);
    expect(getBySlug).toHaveBeenCalledWith("about");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.page.getSlug()).toBe("about");
      expect(result.page.getTitle("fa", "en")).toBe("درباره ما");
    }
  });

  it("maps a 404 and a 410 to not-found", async () => {
    getBySlug.mockRejectedValueOnce(
      new ApiClientError({ message: "Page not found", statusCode: 404 })
    );
    await expect(resolvePublishedPageUncached(["missing"])).resolves.toEqual({
      status: "not-found",
    });
    getBySlug.mockRejectedValueOnce(new ApiClientError({ message: "Gone", statusCode: 410 }));
    await expect(resolvePublishedPageUncached(["gone"])).resolves.toEqual({
      status: "not-found",
    });
  });

  it("treats a record without a published copy as not-found", async () => {
    getBySlug.mockResolvedValue({ ...publishedPage, status: "draft", published: null });
    await expect(resolvePublishedPageUncached(["about"])).resolves.toEqual({
      status: "not-found",
    });
  });

  it("returns any other API failure for the route to throw", async () => {
    const error = new ApiClientError({ message: "Service unavailable", statusCode: 503 });
    getBySlug.mockRejectedValue(error);
    await expect(resolvePublishedPageUncached(["about"])).resolves.toEqual({
      status: "error",
      error,
    });
    const network = ApiClientError.network("offline");
    getBySlug.mockRejectedValue(network);
    await expect(resolvePublishedPageUncached(["about"])).resolves.toEqual({
      status: "error",
      error: network,
    });
  });

  it("rethrows what is not an API error", async () => {
    getBySlug.mockRejectedValue(new TypeError("bug"));
    await expect(resolvePublishedPageUncached(["about"])).rejects.toThrow("bug");
  });
});
