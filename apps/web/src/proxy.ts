import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { createAuthGuard } from "@services/auth/server";
import { routing } from "./i18n/routing";
import { AUTH_COOKIE_PREFIX, PROTECTED_PATHS } from "./lib/auth/config";

const handleLocale = createIntlMiddleware(routing);

/** Strips the locale segment so the guard matches paths the way pages are written. */
function withoutLocale(pathname: string): string {
  const [, first = "", ...rest] = pathname.split("/");
  return (routing.locales as readonly string[]).includes(first)
    ? `/${rest.join("/")}`.replace(/\/$/, "") || "/"
    : pathname;
}

/**
 * Pages that need a session. Everything else is public; the guard only
 * redirects a signed-out visitor away from these and a signed-in one away
 * from the sign-in page.
 */
const guard = createAuthGuard({
  cookiePrefix: AUTH_COOKIE_PREFIX,
  loginPath: "/login",
  publicPaths: ["/login", "/signup", "/forgot-password"],
  homePath: "/account",
  normalizePath: withoutLocale,
});

function needsSession(pathname: string): boolean {
  const path = withoutLocale(pathname);
  return PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export default function proxy(request: NextRequest) {
  const path = withoutLocale(request.nextUrl.pathname);
  if (needsSession(request.nextUrl.pathname) || path === "/login") {
    const redirect = guard(request);
    if (redirect) {
      // Keep the visitor's locale on the redirect target.
      const [, locale = ""] = request.nextUrl.pathname.split("/");
      if ((routing.locales as readonly string[]).includes(locale)) {
        const url = new URL(redirect.headers.get("location") ?? "/", request.url);
        if (!(routing.locales as readonly string[]).includes(url.pathname.split("/")[1] ?? "")) {
          url.pathname = `/${locale}${url.pathname === "/" ? "" : url.pathname}`;
          return Response.redirect(url, 307);
        }
      }
      return redirect;
    }
  }
  return handleLocale(request);
}

export const config = {
  // Everything except API routes, Next internals and static files.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
