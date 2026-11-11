import { resolveProxyTarget } from "./proxy-target";

const PREFIXES = ["/api/v1/me", "/api/v1/examples"];

describe("resolveProxyTarget", () => {
  it("forwards an allowed prefix and its subpaths", () => {
    expect(resolveProxyTarget(["api", "v1", "me"], PREFIXES)).toBe("/api/v1/me");
    expect(resolveProxyTarget(["api", "v1", "examples", "12"], PREFIXES)).toBe(
      "/api/v1/examples/12"
    );
  });

  it("refuses paths outside the allow-list", () => {
    expect(resolveProxyTarget(["api", "v1", "admin", "me"], PREFIXES)).toBeNull();
    expect(resolveProxyTarget(["api", "v1", "examples-archive"], PREFIXES)).toBeNull();
    expect(resolveProxyTarget([], PREFIXES)).toBeNull();
  });

  it("refuses dot segments, however they were encoded", () => {
    // `/examples/../admin/me`: the router normalises this before the handler, but the check must hold alone.
    expect(resolveProxyTarget(["api", "v1", "examples", "..", "admin", "me"], PREFIXES)).toBeNull();
    // `/examples/..%2fadmin/me`: arrives as one decoded segment holding a slash.
    expect(resolveProxyTarget(["api", "v1", "examples", "../admin", "me"], PREFIXES)).toBeNull();
    expect(resolveProxyTarget(["api", "v1", "examples", "..\\admin", "me"], PREFIXES)).toBeNull();
    expect(resolveProxyTarget(["api", "v1", "examples", ".", "x"], PREFIXES)).toBeNull();
    expect(resolveProxyTarget(["api", "v1", "examples", ""], PREFIXES)).toBeNull();
  });

  it("re-encodes characters a backend would otherwise misread", () => {
    expect(resolveProxyTarget(["api", "v1", "examples", "a b?c"], PREFIXES)).toBe(
      "/api/v1/examples/a%20b%3Fc"
    );
  });

  it("ignores empty prefixes and trailing slashes in the configuration", () => {
    expect(resolveProxyTarget(["api", "v1", "me"], ["", "/api/v1/me/"])).toBe("/api/v1/me");
    expect(resolveProxyTarget(["api", "v1", "me"], [""])).toBeNull();
  });
});
