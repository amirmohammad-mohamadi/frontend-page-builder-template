import { resolveLocalizedText } from "./localized-text";

describe("resolveLocalizedText", () => {
  const text = { en: "About us", fa: "درباره ما", nl: "  " };

  it("returns the requested locale", () => {
    expect(resolveLocalizedText(text, "fa")).toBe("درباره ما");
  });

  it("falls back to the fallback locale when the requested one is missing or blank", () => {
    expect(resolveLocalizedText(text, "ru", "en")).toBe("About us");
    expect(resolveLocalizedText(text, "nl", "fa")).toBe("درباره ما");
  });

  it("falls back to the first non-empty translation when neither locale has one", () => {
    expect(resolveLocalizedText({ nl: "", fa: "سلام" }, "en", "ru")).toBe("سلام");
  });

  it("returns an empty string for a missing or empty record", () => {
    expect(resolveLocalizedText(undefined, "en", "fa")).toBe("");
    expect(resolveLocalizedText({}, "en")).toBe("");
    expect(resolveLocalizedText({ en: "   " }, "en")).toBe("");
  });
});
