import { MediaAssetModel } from "./media-asset.model";

describe("MediaAssetModel", () => {
  const image = new MediaAssetModel({
    id: 7,
    url: "http://localhost:4000/uploads/7-logo.png",
    name: "logo.png",
    mime: "image/png",
    size: 1234,
    width: 64,
    height: 32,
    alt: { en: "Company logo" },
  });

  it("exposes the file fields", () => {
    expect(image.getUrl()).toBe("http://localhost:4000/uploads/7-logo.png");
    expect(image.getName()).toBe("logo.png");
    expect(image.getMime()).toBe("image/png");
    expect(image.getSize()).toBe(1234);
    expect(image.getWidth()).toBe(64);
    expect(image.getHeight()).toBe(32);
  });

  it("resolves the alt text with a fallback locale", () => {
    expect(image.getAlt("fa", "en")).toBe("Company logo");
    expect(image.getAlt("fa")).toBe("Company logo");
    expect(new MediaAssetModel({ id: 1, alt: {} }).getAlt("en", "fa")).toBe("");
  });

  it("classifies images and videos by mime type", () => {
    expect(image.isImage()).toBe(true);
    expect(image.isVideo()).toBe(false);
    const clip = new MediaAssetModel({ id: 2, mime: "video/mp4" });
    expect(clip.isVideo()).toBe(true);
    expect(clip.isImage()).toBe(false);
    expect(clip.getWidth()).toBeNull();
  });
});
