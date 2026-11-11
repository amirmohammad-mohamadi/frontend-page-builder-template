import { localizeHref, objectToSearchParams, switchLocaleInPath } from "./url";

const LOCALES = ["en", "fa"];

describe("localizeHref", () => {
  it("prefixes root-relative page paths", () => {
    expect(localizeHref("/about", "fa", LOCALES)).toBe("/fa/about");
    expect(localizeHref("/", "fa", LOCALES)).toBe("/fa");
    expect(localizeHref("/about?x=1#y", "en", LOCALES)).toBe("/en/about?x=1#y");
  });

  it("leaves external, already-localised and non-page paths alone", () => {
    expect(localizeHref("https://example.org", "fa", LOCALES)).toBe("https://example.org");
    expect(localizeHref("/en/about", "fa", LOCALES)).toBe("/en/about");
    expect(localizeHref("/api/health", "fa", LOCALES)).toBe("/api/health");
    expect(localizeHref("/files/report.pdf", "fa", LOCALES)).toBe("/files/report.pdf");
    expect(localizeHref("#top", "fa", LOCALES)).toBe("#top");
  });
});

describe("switchLocaleInPath", () => {
  it("replaces the locale segment", () => {
    expect(switchLocaleInPath("/en/examples/3", "fa", LOCALES)).toBe("/fa/examples/3");
    expect(switchLocaleInPath("/en", "fa", LOCALES)).toBe("/fa");
  });
});

describe("objectToSearchParams", () => {
  it("skips null and undefined values", () => {
    expect(objectToSearchParams({ a: 1, b: null, c: undefined, d: "x" }).toString()).toBe(
      "a=1&d=x"
    );
  });
});
