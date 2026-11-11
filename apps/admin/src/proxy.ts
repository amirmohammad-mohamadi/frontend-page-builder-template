import { NextResponse, type NextRequest } from "next/server";
import { createAuthGuard } from "@services/auth/server";
import { AUTH_COOKIE_PREFIX, PUBLIC_PATHS } from "./lib/auth/config";

/** Every admin page needs a session except the auth pages. */
const guard = createAuthGuard({
  cookiePrefix: AUTH_COOKIE_PREFIX,
  loginPath: "/login",
  publicPaths: PUBLIC_PATHS,
});

export default function proxy(request: NextRequest) {
  return guard(request) ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
