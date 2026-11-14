import { fallbackText, localeText, writeLocaleText } from "./translatable-trait";

const STORED = JSON.stringify({ en: "Hello", fa: "سلام" });

describe("localeText", () => {
  it("reads exactly the edited locale's text, never a fallback", () => {
    expect(localeText(STORED, "en", "en")).toBe("Hello");
    expect(localeText(STORED, "fa", "en")).toBe("سلام");
    expect(localeText(JSON.stringify({ en: "Only" }), "fa", "en")).toBe("");
  });

  it("reads a plain string as the default locale's text", () => {
    expect(localeText("Plain", "en", "en")).toBe("Plain");
    expect(localeText("Plain", "fa", "en")).toBe("");
  });
});

describe("fallbackText", () => {
  it("is what the page falls back to while the locale has no text, and empty otherwise", () => {
    expect(fallbackText(JSON.stringify({ en: "Only" }), "fa", "en")).toBe("Only");
    expect(fallbackText(STORED, "fa", "en")).toBe("");
    expect(fallbackText("", "fa", "en")).toBe("");
  });
});

describe("writeLocaleText", () => {
  it("replaces one locale's text and keeps the others", () => {
    expect(JSON.parse(writeLocaleText(STORED, "fa", "درود", "en"))).toEqual({
      en: "Hello",
      fa: "درود",
    });
  });

  it("upgrades a plain string to a record when another locale is written", () => {
    expect(JSON.parse(writeLocaleText("Plain", "fa", "ساده", "en"))).toEqual({
      en: "Plain",
      fa: "ساده",
    });
  });

  it("removes a locale when its text is cleared", () => {
    expect(JSON.parse(writeLocaleText(STORED, "fa", "", "en"))).toEqual({ en: "Hello" });
  });

  it("reduces rich text to the allow-list before storing it", () => {
    const written = writeLocaleText(
      "",
      "en",
      '<p onclick="x()">Hi <strong>there</strong><script>1</script></p>',
      "en",
      "richtext"
    );
    const text = JSON.parse(written).en as string;
    expect(text).toContain("<strong>there</strong>");
    expect(text).not.toContain("onclick");
    expect(text).not.toContain("<script>");
  });
});
