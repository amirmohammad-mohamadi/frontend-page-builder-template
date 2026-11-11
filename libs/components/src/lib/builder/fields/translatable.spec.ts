import {
  parseTranslatable,
  resolveTranslatable,
  serializeTranslatable,
  setTranslation,
} from "./translatable";

describe("parseTranslatable", () => {
  it("reads a JSON locale record", () => {
    expect(parseTranslatable('{"en":"Hello","fa":"سلام"}')).toEqual({ en: "Hello", fa: "سلام" });
  });

  it("reads a plain string as the default-locale text", () => {
    expect(parseTranslatable("Hello")).toEqual({ en: "Hello" });
    expect(parseTranslatable("Hallo", "nl")).toEqual({ nl: "Hallo" });
  });

  it("keeps a plain text that uses braces but is not a record", () => {
    expect(parseTranslatable("{not json}")).toEqual({ en: "{not json}" });
    expect(parseTranslatable('{"a": 1}')).toEqual({});
  });

  it("accepts a record object and drops non-string entries", () => {
    expect(parseTranslatable({ en: "Hi", fa: 3 })).toEqual({ en: "Hi" });
  });

  it("gives an empty record for empty or non-text input", () => {
    expect(parseTranslatable("")).toEqual({});
    expect(parseTranslatable(undefined)).toEqual({});
    expect(parseTranslatable(42)).toEqual({});
  });
});

describe("resolveTranslatable", () => {
  const stored = '{"en":"Hello","fa":"سلام"}';

  it("picks the requested locale", () => {
    expect(resolveTranslatable(stored, "fa", "en")).toBe("سلام");
  });

  it("matches a regional locale by its language", () => {
    expect(resolveTranslatable(stored, "fa-IR", "en")).toBe("سلام");
  });

  it("falls back to the default locale", () => {
    expect(resolveTranslatable(stored, "nl", "en")).toBe("Hello");
    expect(resolveTranslatable('{"fa":"سلام"}', "nl", "en")).toBe("سلام");
  });

  it("serves a plain string to every locale", () => {
    expect(resolveTranslatable("Hello", "fa", "en")).toBe("Hello");
  });

  it("is empty when nothing is stored", () => {
    expect(resolveTranslatable("", "fa")).toBe("");
    expect(resolveTranslatable(undefined, "fa")).toBe("");
  });
});

describe("serializeTranslatable and setTranslation", () => {
  it("round-trips through parse", () => {
    const text = serializeTranslatable({ en: "Hello", fa: "سلام" });
    expect(parseTranslatable(text)).toEqual({ en: "Hello", fa: "سلام" });
  });

  it("drops empty texts and serializes an empty record to an empty string", () => {
    expect(serializeTranslatable({ en: "Hello", fa: "" })).toBe('{"en":"Hello"}');
    expect(serializeTranslatable({})).toBe("");
  });

  it("adds a locale to a plain string", () => {
    expect(parseTranslatable(setTranslation("Hello", "fa", "سلام"))).toEqual({
      en: "Hello",
      fa: "سلام",
    });
  });

  it("replaces and removes a locale of a record", () => {
    const stored = '{"en":"Hello","fa":"سلام"}';
    expect(parseTranslatable(setTranslation(stored, "fa", "درود"))).toEqual({
      en: "Hello",
      fa: "درود",
    });
    expect(parseTranslatable(setTranslation(stored, "fa", ""))).toEqual({ en: "Hello" });
  });
});
