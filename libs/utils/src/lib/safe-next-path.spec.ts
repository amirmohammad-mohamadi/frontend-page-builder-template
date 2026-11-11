import { getSafeNextPath } from "./safe-next-path";

const ORIGIN = "https://app.example";

describe("getSafeNextPath", () => {
  it("keeps a same-origin relative path", () => {
    expect(getSafeNextPath("/account?tab=orders", ORIGIN)).toBe("/account?tab=orders");
  });

  it("falls back to / for empty, absolute and protocol-relative values", () => {
    expect(getSafeNextPath(null, ORIGIN)).toBe("/");
    expect(getSafeNextPath("", ORIGIN)).toBe("/");
    expect(getSafeNextPath("https://evil.example/x", ORIGIN)).toBe("/");
    expect(getSafeNextPath("//evil.example/x", ORIGIN)).toBe("/");
    expect(getSafeNextPath("/\\evil.example", ORIGIN)).toBe("/");
  });

  it("rejects a path the URL parser would read as another origin", () => {
    expect(getSafeNextPath("/\t/evil.example", ORIGIN)).toBe("/");
  });
});
