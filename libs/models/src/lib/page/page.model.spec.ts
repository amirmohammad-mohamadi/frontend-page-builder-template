import { PageModel } from "./page.model";

describe("PageModel", () => {
  const page = new PageModel({
    id: 1,
    slug: "about",
    status: "published",
    title: { en: "About us", fa: "درباره ما" },
    seo: { description: { en: "Who we are" }, image: null },
    draft: { components: [{ type: "section" }], styles: [] },
    published: { components: [], styles: [], css: "" },
    published_at: "2026-01-02T03:04:05.000Z",
  });

  it("resolves the title per locale with a fallback", () => {
    expect(page.getTitle("fa")).toBe("درباره ما");
    expect(page.getTitle("ru", "en")).toBe("About us");
    expect(page.getTitle("ru")).toBe("About us");
  });

  it("resolves the SEO description per locale and the image to null when unset", () => {
    expect(page.getSeoDescription("fa", "en")).toBe("Who we are");
    expect(page.getSeoImage()).toBeNull();
  });

  it("reports the publish state and dates", () => {
    expect(page.isPublished()).toBe(true);
    expect(page.getPublishedAt()?.toISOString()).toBe("2026-01-02T03:04:05.000Z");
    expect(page.getPublished()?.css).toBe("");
    expect(page.getDraft().components).toHaveLength(1);
  });

  it("treats a draft without a published copy as unpublished with empty defaults", () => {
    const draft = new PageModel({ id: 2, slug: "x", status: "draft" });
    expect(draft.isPublished()).toBe(false);
    expect(draft.getPublished()).toBeNull();
    expect(draft.getPublishedAt()).toBeNull();
    expect(draft.getDraft()).toEqual({ components: [], styles: [] });
    expect(draft.getTitle("en", "fa")).toBe("");
  });

  it("is unpublished when the status says published but no copy exists", () => {
    const odd = new PageModel({ id: 3, slug: "x", status: "published", published: null });
    expect(odd.isPublished()).toBe(false);
  });
});
