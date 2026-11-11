import { isRtlLocale, isolateDirection, textDirection } from "./text-direction";

describe("textDirection", () => {
  it("is rtl for any text holding a right-to-left letter", () => {
    expect(textDirection("سلام")).toBe("rtl");
    expect(textDirection("Model X و Y")).toBe("rtl");
  });

  it("is undefined for Latin text, digits and empty values", () => {
    expect(textDirection("Hello")).toBeUndefined();
    expect(textDirection("۱۲۳")).toBeUndefined();
    expect(textDirection("")).toBeUndefined();
    expect(textDirection(null)).toBeUndefined();
  });
});

describe("isolateDirection", () => {
  it("is rtl only when an RTL text starts with an LTR letter", () => {
    expect(isolateDirection("Model X و Y")).toBe("rtl");
    expect(isolateDirection("سلام Model X")).toBeUndefined();
    expect(isolateDirection("Hello")).toBeUndefined();
  });
});

describe("isRtlLocale", () => {
  it("decides by language subtag", () => {
    expect(isRtlLocale("fa")).toBe(true);
    expect(isRtlLocale("ar-EG")).toBe(true);
    expect(isRtlLocale("en-GB")).toBe(false);
  });
});
