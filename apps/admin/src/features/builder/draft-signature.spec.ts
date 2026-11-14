import { buildDraftSignature, isDraftChanged, stableStringify } from "./draft-signature";

describe("stableStringify", () => {
  it("serialises objects the same way whatever their key order", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 })
    );
  });

  it("keeps array order, because component order is content", () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
  });

  it("drops undefined and function values from objects like JSON.stringify", () => {
    expect(stableStringify({ a: 1, b: undefined, c: () => 1 })).toBe(stableStringify({ a: 1 }));
  });

  it("turns undefined array items into null like JSON.stringify", () => {
    expect(stableStringify([undefined])).toBe("[null]");
  });

  it("handles primitives and a missing top-level value", () => {
    expect(stableStringify("x")).toBe('"x"');
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(undefined)).toBe("null");
  });
});

describe("buildDraftSignature", () => {
  const draft = {
    components: [{ type: "hero", attributes: { title: "A" } }],
    styles: [{ selectors: ["#a"], style: { color: "red" } }],
    css: "#a{color:red;}",
  };

  it("is stable for structurally equal drafts", () => {
    const reordered = {
      css: "#a{color:red;}",
      styles: [{ style: { color: "red" }, selectors: ["#a"] }],
      components: [{ attributes: { title: "A" }, type: "hero" }],
    };
    expect(buildDraftSignature(draft)).toBe(buildDraftSignature(reordered));
  });

  it("changes when the tree, the rules or the CSS change", () => {
    expect(buildDraftSignature({ ...draft, components: [] })).not.toBe(buildDraftSignature(draft));
    expect(buildDraftSignature({ ...draft, styles: [] })).not.toBe(buildDraftSignature(draft));
    expect(buildDraftSignature({ ...draft, css: "" })).not.toBe(buildDraftSignature(draft));
  });

  it("signs a missing draft as an empty one", () => {
    expect(buildDraftSignature(undefined)).toBe(
      buildDraftSignature({ components: [], styles: [], css: "" })
    );
  });
});

describe("isDraftChanged", () => {
  it("is false when the signature matches the recorded save", () => {
    expect(isDraftChanged("sig", "sig")).toBe(false);
  });

  it("is true when the signature moved or none was recorded", () => {
    expect(isDraftChanged("sig", "other")).toBe(true);
    expect(isDraftChanged("sig", null)).toBe(true);
    expect(isDraftChanged("sig", undefined)).toBe(true);
  });
});
