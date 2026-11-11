import { NextRequest } from "next/server";
import { createAuthGuard } from "./guard";

const guard = createAuthGuard({
  cookiePrefix: "web",
  loginPath: "/login",
  publicPaths: ["/login", "/signup"],
  homePath: "/account",
});

const request = (path: string, cookies: Record<string, string> = {}) =>
  new NextRequest(`http://app.test${path}`, {
    headers:
      cookies && Object.keys(cookies).length
        ? {
            cookie: Object.entries(cookies)
              .map(([k, v]) => `${k}=${v}`)
              .join("; "),
          }
        : {},
  });

const futureJwt = `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 600 })).toString("base64url")}.x`;
const expiredJwt = `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 600 })).toString("base64url")}.x`;

describe("createAuthGuard", () => {
  it("sends a signed-out visitor to the login page with next", () => {
    const res = guard(request("/account?tab=1"));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("http://app.test/login?next=%2Faccount%3Ftab%3D1");
  });

  it("lets a signed-out visitor open public paths", () => {
    expect(guard(request("/login"))).toBeNull();
    expect(guard(request("/signup/step-2"))).toBeNull();
  });

  it("accepts a valid access cookie or a refresh cookie alone", () => {
    expect(guard(request("/account", { web_access: futureJwt }))).toBeNull();
    expect(guard(request("/account", { web_refresh: "r" }))).toBeNull();
  });

  it("treats an expired access cookie without a refresh cookie as signed out", () => {
    expect(guard(request("/account", { web_access: expiredJwt }))?.status).toBe(307);
  });

  it("sends a signed-in visitor away from the login page, to a safe next or home", () => {
    expect(
      guard(request("/login?next=%2Fsettings", { web_refresh: "r" }))?.headers.get("location")
    ).toBe("http://app.test/settings");
    expect(
      guard(request("/login?next=https%3A%2F%2Fevil.test", { web_refresh: "r" }))?.headers.get(
        "location"
      )
    ).toBe("http://app.test/account");
  });

  it("normalises the path before matching when asked", () => {
    const localized = createAuthGuard({
      cookiePrefix: "web",
      loginPath: "/login",
      publicPaths: ["/login"],
      normalizePath: (p) => p.replace(/^\/(en|fa)(?=\/|$)/, "") || "/",
    });
    expect(localized(request("/fa/login"))).toBeNull();
    expect(localized(request("/fa/account"))?.status).toBe(307);
  });
});
