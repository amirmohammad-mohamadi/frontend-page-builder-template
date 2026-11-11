import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import {
  authPayloadSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sessionUserSchema,
  type AuthPayloadDto,
  type SessionUserDto,
  type TokenPairDto,
} from "@dtos";
import { readBodyWithCap } from "@utils";
import { getBackendAdapter } from "../../shared/backend-adapter";
import { NO_STORE_HEADERS, type AuthServerConfig } from "./config";
import { jwtSecondsToExpiry } from "./jwt";
import { resolveProxyTarget } from "./proxy-target";

type RouteContext = { params: Promise<{ path: string[] }> };
type Handler = (req: NextRequest) => Promise<NextResponse>;

/** Options of a credential-exchange strategy: validate a body, post it to the backend, open a session. */
export type CredentialStrategy<TInput> = {
  /** Validates the request body; a failure answers 422 with field errors. */
  schema: ZodType<TInput>;
  /** The backend path to post the validated body to. */
  path: string;
  /** Reshapes the validated body before it is sent; default: as it is. */
  toBackendBody?: (input: TInput) => unknown;
  /**
   * Whether the session outlives the browser session. Default: the value of
   * a boolean `remember` field in the validated body, else `true`.
   */
  persistent?: (input: TInput) => boolean;
};

/** How the cookies are written: for the token lifetimes, or for the browser session only. */
export type SessionOptions = { persistent?: boolean };

const DEFAULT_FORWARD_HEADERS = ["content-type", "accept", "accept-language"];
const DEFAULT_ACCESS_MAX_AGE = 60 * 60 * 24;
const DEFAULT_REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
const DEFAULT_TIMEOUT_MS = 10_000;
/** The largest JSON body an auth route reads; a sign-in form is a few hundred bytes. */
const DEFAULT_AUTH_BODY_BYTES = 64 * 1024;
/** The largest body the proxy forwards; raise `maxProxyBodyBytes` for uploads. */
const DEFAULT_PROXY_BODY_BYTES = 10 * 1024 * 1024;
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function defaultReadAuthPayload(body: unknown): AuthPayloadDto | null {
  for (const candidate of [body, isRecord(body) ? body.data : undefined]) {
    const parsed = authPayloadSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }
  return null;
}

function defaultReadUser(body: unknown): SessionUserDto | null {
  for (const candidate of [
    body,
    isRecord(body) ? body.data : undefined,
    isRecord(body) ? body.user : undefined,
  ]) {
    const parsed = sessionUserSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
  }
  return null;
}

/** Same-origin check for non-GET BFF calls: belt and braces on top of SameSite cookies. */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const hosts = [
    req.headers.get("host"),
    req.headers.get("x-forwarded-host"),
    req.nextUrl.host,
  ].filter(Boolean);
  try {
    return hosts.includes(new URL(origin).host);
  } catch {
    return false;
  }
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...NO_STORE_HEADERS, ...headers } });

/** The request body as JSON, or the response that refuses it (413 too large, 400 not JSON). */
async function readJsonBody(
  req: NextRequest,
  maxBytes: number
): Promise<{ body: unknown } | { refusal: NextResponse }> {
  const bytes = await readBodyWithCap(req.body, req.headers.get("content-length"), maxBytes);
  if (bytes === null) return { refusal: json({ message: "Request body too large" }, 413) };
  try {
    return { body: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { refusal: json({ message: "Invalid request body" }, 400) };
  }
}

/**
 * Builds the server side of the BFF auth pattern for one app: cookie
 * management, a single-flight token refresh, the standard route handlers and
 * the authenticated proxy. Each app calls this once in `src/lib/auth/server.ts`
 * and re-exports the handlers from its route files.
 *
 * Adding a strategy (OTP, magic link, social sign-in callback) is one call to
 * `credentialHandler` with the strategy's schema and backend path; no file
 * here changes.
 */
export function createAuthServer(config: AuthServerConfig) {
  const cookies = {
    access: `${config.cookiePrefix}_access`,
    refresh: `${config.cookiePrefix}_refresh`,
  };
  const backend = config.backend;
  const readAuthPayload = backend.readAuthPayload ?? defaultReadAuthPayload;
  const readUser = backend.readUser ?? defaultReadUser;
  const refreshBody = backend.refreshBody ?? ((refresh_token: string) => ({ refresh_token }));
  const forwardHeaders = config.forwardHeaders ?? DEFAULT_FORWARD_HEADERS;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const authBodyBytes = config.maxAuthBodyBytes ?? DEFAULT_AUTH_BODY_BYTES;
  const proxyBodyBytes = config.maxProxyBodyBytes ?? DEFAULT_PROXY_BODY_BYTES;
  // Production cookies are Secure unless a deployment says otherwise (plain-http staging).
  const secure = config.secureCookies ?? process.env.NODE_ENV === "production";

  const backendUrl = (path: string) =>
    `${backend.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const backendFetch = (path: string, init: RequestInit, token?: string) =>
    fetch(backendUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...backend.headers?.(),
        ...(init.headers as Record<string, string> | undefined),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

  /**
   * Writes the session cookies. A persistent session lives as long as its
   * tokens; a non-persistent one ("remember me" left unticked) ends with the
   * browser session, while the tokens still expire server-side.
   */
  function setSession(res: NextResponse, tokens: TokenPairDto, options: SessionOptions = {}): void {
    const persistent = options.persistent ?? true;
    const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
    const accessMaxAge =
      tokens.expires_in ??
      jwtSecondsToExpiry(tokens.access_token) ??
      config.maxAge?.access ??
      DEFAULT_ACCESS_MAX_AGE;
    const refreshMaxAge =
      jwtSecondsToExpiry(tokens.refresh_token) ?? config.maxAge?.refresh ?? DEFAULT_REFRESH_MAX_AGE;
    res.cookies.set(cookies.access, tokens.access_token, {
      ...base,
      ...(persistent ? { maxAge: accessMaxAge } : {}),
    });
    res.cookies.set(cookies.refresh, tokens.refresh_token, {
      ...base,
      ...(persistent ? { maxAge: refreshMaxAge } : {}),
    });
  }

  function clearSession(res: NextResponse): void {
    res.cookies.set(cookies.access, "", { httpOnly: true, path: "/", maxAge: 0 });
    res.cookies.set(cookies.refresh, "", { httpOnly: true, path: "/", maxAge: 0 });
  }

  function readSession(req: NextRequest) {
    const accessToken = req.cookies.get(cookies.access)?.value;
    const refreshToken = req.cookies.get(cookies.refresh)?.value;
    return { accessToken, refreshToken, isAuthenticated: Boolean(accessToken || refreshToken) };
  }

  // One backend refresh per refresh token per server instance, however many requests race for it.
  const inflight = new Map<string, Promise<AuthPayloadDto | null>>();
  function refreshTokens(refreshToken: string): Promise<AuthPayloadDto | null> {
    const existing = inflight.get(refreshToken);
    if (existing) return existing;
    const promise = (async () => {
      try {
        const res = await backendFetch(backend.paths.refresh, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(refreshBody(refreshToken)),
        });
        if (!res.ok) return null;
        return readAuthPayload(await res.json());
      } catch {
        return null;
      } finally {
        setTimeout(() => inflight.delete(refreshToken), 5_000).unref?.();
      }
    })();
    inflight.set(refreshToken, promise);
    return promise;
  }

  /**
   * Passes a backend refusal on with its status and `Retry-After`, but only
   * the fields the frontend understands (`message`, `statusCode`, `code`,
   * `errors`), read through the backend adapter: whatever else a backend
   * puts in an error body (stack, query, internal ids) stays server-side.
   */
  const upstreamError = async (upstream: Response) => {
    const body = await upstream.json().catch(() => undefined);
    const dto = getBackendAdapter().readError(body, upstream.status, upstream.statusText);
    const retryAfter = upstream.headers.get("retry-after");
    return json(dto, upstream.status, retryAfter ? { "Retry-After": retryAfter } : {});
  };

  const validationError = (issues: { path: PropertyKey[]; message: string }[]) => {
    const errors: Record<string, string[]> = {};
    for (const issue of issues) {
      const field = issue.path.map(String).join(".") || "body";
      errors[field] = [...(errors[field] ?? []), issue.message];
    }
    return json({ message: "The given data was invalid.", statusCode: 422, errors }, 422);
  };

  /** Validates a strategy's body: the parsed input, or the response that refuses it. */
  async function readStrategyInput<TInput>(
    req: NextRequest,
    strategy: CredentialStrategy<TInput>
  ): Promise<{ input: TInput } | { refusal: NextResponse }> {
    if (!isSameOriginRequest(req)) return { refusal: json({ message: "Forbidden" }, 403) };
    const read = await readJsonBody(req, authBodyBytes);
    if ("refusal" in read) return read;
    const parsed = strategy.schema.safeParse(read.body);
    if (!parsed.success) return { refusal: validationError(parsed.error.issues) };
    return { input: parsed.data };
  }

  const postStrategy = <TInput>(strategy: CredentialStrategy<TInput>, input: TInput) =>
    backendFetch(strategy.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(strategy.toBackendBody ? strategy.toBackendBody(input) : input),
    }).catch(() => null);

  const isPersistent = <TInput>(strategy: CredentialStrategy<TInput>, input: TInput): boolean => {
    if (strategy.persistent) return strategy.persistent(input);
    const remember = isRecord(input) ? input.remember : undefined;
    return typeof remember === "boolean" ? remember : true;
  };

  /**
   * A route handler that validates the body with `schema`, posts it to the
   * backend and opens a session from the answer. `login`, `register` and
   * `resetPassword` are built with it; a project's extra strategies are too.
   */
  function credentialHandler<TInput>(strategy: CredentialStrategy<TInput>): Handler {
    return async (req) => {
      const read = await readStrategyInput(req, strategy);
      if ("refusal" in read) return read.refusal;
      const upstream = await postStrategy(strategy, read.input);
      if (!upstream) return json({ message: "The sign-in service is unreachable." }, 502);
      if (!upstream.ok) return upstreamError(upstream);
      const payload = readAuthPayload(await upstream.json().catch(() => null));
      if (!payload) return json({ message: "The sign-in service sent an unexpected answer." }, 502);
      const res = json({ data: { user: payload.user } });
      setSession(res, payload, { persistent: isPersistent(strategy, read.input) });
      return res;
    };
  }

  /** A route handler that forwards a body to the backend without opening a session (forgot password). */
  function passthroughHandler<TInput>(strategy: CredentialStrategy<TInput>): Handler {
    return async (req) => {
      const read = await readStrategyInput(req, strategy);
      if ("refusal" in read) return read.refusal;
      const upstream = await postStrategy(strategy, read.input);
      if (!upstream) return json({ message: "The service is unreachable." }, 502);
      if (!upstream.ok) return upstreamError(upstream);
      return json({ data: { success: true } });
    };
  }

  const logout: Handler = async (req) => {
    if (!isSameOriginRequest(req)) return json({ message: "Forbidden" }, 403);
    const { accessToken } = readSession(req);
    if (accessToken) {
      await backendFetch(backend.paths.logout, { method: "POST" }, accessToken).catch(
        () => undefined
      );
    }
    const res = json({ data: { success: true } });
    clearSession(res);
    return res;
  };

  /**
   * Sends `path` to the backend with the session token, refreshing it once
   * on a 401. `sessionLost` is true only when the session cannot be
   * recovered: no refresh token, or the refresh itself was rejected. A 401
   * the backend returns after a successful refresh is the endpoint's own
   * answer and leaves the session alone.
   */
  async function authenticatedFetch(req: NextRequest, path: string, init: RequestInit) {
    const { accessToken, refreshToken } = readSession(req);
    let upstream = await backendFetch(path, init, accessToken);
    let rotated: TokenPairDto | null = null;
    let sessionLost = false;
    if (upstream.status === 401) {
      const refreshed = refreshToken ? await refreshTokens(refreshToken) : null;
      if (refreshed) {
        rotated = refreshed;
        upstream = await backendFetch(path, init, refreshed.access_token);
      } else {
        sessionLost = true;
      }
    }
    return { upstream, rotated, sessionLost };
  }

  /**
   * The session, as `{ user }` or `{ user: null }` with status 200: a
   * signed-out visitor is a normal answer, not an error, so the browser
   * console stays clean and the client treats both cases the same way.
   */
  const me: Handler = async (req) => {
    if (!readSession(req).isAuthenticated) return json({ data: { user: null } });
    const result = await authenticatedFetch(req, backend.paths.me, { method: "GET" }).catch(
      () => null
    );
    if (!result) return json({ message: "The service is unreachable." }, 502);
    const { upstream, rotated, sessionLost } = result;
    if (sessionLost) {
      const res = json({ data: { user: null } });
      clearSession(res);
      return res;
    }
    if (!upstream.ok) return upstreamError(upstream);
    const user = readUser(await upstream.json().catch(() => null));
    if (!user) return json({ message: "The service sent an unexpected answer." }, 502);
    const res = json({ data: { user } });
    if (rotated) setSession(res, rotated);
    return res;
  };

  /** `/api/backend/[...path]`: forwards allowed backend paths with the session token. */
  async function proxy(req: NextRequest, context: RouteContext): Promise<NextResponse> {
    if (req.method !== "GET" && !isSameOriginRequest(req))
      return json({ message: "Forbidden" }, 403);
    const { path } = await context.params;
    const target = resolveProxyTarget(path, config.proxyPrefixes);
    if (target === null) return json({ message: "Not found" }, 404);
    const headers: Record<string, string> = {};
    for (const name of forwardHeaders) {
      const value = req.headers.get(name);
      if (value) headers[name] = value;
    }
    // Buffered once (bounded) so the request can be sent again after a token refresh.
    let body: Uint8Array<ArrayBuffer> | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      const bytes = await readBodyWithCap(
        req.body,
        req.headers.get("content-length"),
        proxyBodyBytes
      );
      if (bytes === null) return json({ message: "Request body too large" }, 413);
      body = bytes;
    }
    const result = await authenticatedFetch(req, `${target}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body,
    }).catch(() => null);
    if (!result) return json({ message: "The service is unreachable." }, 502);
    const { upstream, rotated, sessionLost } = result;

    // A 204/205/304 may carry no body at all: the Response constructor throws otherwise.
    const bodyless = NULL_BODY_STATUSES.has(upstream.status);
    const res = new NextResponse(bodyless ? null : await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        ...NO_STORE_HEADERS,
        ...(bodyless
          ? {}
          : { "Content-Type": upstream.headers.get("content-type") ?? "application/json" }),
      },
    });
    if (rotated) setSession(res, rotated);
    else if (sessionLost) clearSession(res);
    return res;
  }

  const schemas = config.schemas ?? {};
  const handlers = {
    login: credentialHandler({ schema: schemas.login ?? loginSchema, path: backend.paths.login }),
    logout,
    me,
    register: backend.paths.register
      ? credentialHandler({
          schema: schemas.register ?? registerSchema,
          path: backend.paths.register,
        })
      : undefined,
    forgotPassword: backend.paths.forgotPassword
      ? passthroughHandler({
          schema: schemas.forgotPassword ?? forgotPasswordSchema,
          path: backend.paths.forgotPassword,
        })
      : undefined,
    resetPassword: backend.paths.resetPassword
      ? credentialHandler({
          schema: schemas.resetPassword ?? resetPasswordSchema,
          path: backend.paths.resetPassword,
        })
      : undefined,
    proxy,
  };

  return {
    cookies,
    setSession,
    clearSession,
    readSession,
    refreshTokens,
    credentialHandler,
    passthroughHandler,
    isSameOriginRequest,
    handlers,
  };
}

export type AuthServer = ReturnType<typeof createAuthServer>;
