import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@utils";
import { isJwtExpired } from "./jwt";

export type AuthGuardConfig = {
  /** The same prefix the app's `createAuthServer` uses. */
  cookiePrefix: string;
  /** The sign-in page; a signed-out visitor is sent here with `?next=`. */
  loginPath: string;
  /** Paths (and their subpaths) a signed-out visitor may open. */
  publicPaths: readonly string[];
  /** Where a signed-in visitor goes when opening a public auth page such as `/login`. Default `/`. */
  homePath?: string;
  /** Strips a locale prefix before matching paths, for localized apps. Default: identity. */
  normalizePath?: (pathname: string) => string;
};

/**
 * The edge-side auth check for `proxy.ts` (Next.js middleware): the real
 * httpOnly cookies decide. A refresh cookie alone is enough, since the BFF
 * mints a new access token on the first API call. Returns a redirect, or
 * `null` to let the request through.
 */
export function createAuthGuard(config: AuthGuardConfig) {
  const access = `${config.cookiePrefix}_access`;
  const refresh = `${config.cookiePrefix}_refresh`;
  const normalize = config.normalizePath ?? ((p: string) => p);

  return function guard(request: NextRequest): NextResponse | null {
    const pathname = normalize(request.nextUrl.pathname);
    const isPublic = config.publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const accessToken = request.cookies.get(access)?.value;
    const isAuthenticated =
      (!!accessToken && !isJwtExpired(accessToken)) || request.cookies.has(refresh);

    if (!isAuthenticated && !isPublic) {
      const loginUrl = new URL(config.loginPath, request.url);
      loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    if (isAuthenticated && pathname === config.loginPath) {
      const next = getSafeNextPath(request.nextUrl.searchParams.get("next"), request.url);
      return NextResponse.redirect(
        new URL(next === "/" ? (config.homePath ?? "/") : next, request.url)
      );
    }
    return null;
  };
}
