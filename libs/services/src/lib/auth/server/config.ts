import type { ZodType } from "zod";
import type { AuthPayloadDto, SessionUserDto } from "@dtos";

/** Backend paths and body mappers for the credential-exchange strategies the BFF supports. */
export type AuthBackendConfig = {
  /** The backend origin the server reaches (INTERNAL_API_BASE_URL). */
  baseUrl: string;
  paths: {
    login: string;
    logout: string;
    refresh: string;
    me: string;
    register?: string;
    forgotPassword?: string;
    resetPassword?: string;
  };
  /**
   * Maps a backend sign-in body onto the frontend's `AuthPayloadDto`
   * (`access_token`, `refresh_token`, `user`). The default accepts the body
   * itself or its `data` member when it already has that shape; a backend
   * that names the fields differently overrides this.
   */
  readAuthPayload?: (body: unknown) => AuthPayloadDto | null;
  /** Maps the backend's current-user body onto `SessionUserDto`. Same default as above for `user`. */
  readUser?: (body: unknown) => SessionUserDto | null;
  /** The body the refresh endpoint expects. Default `{ refresh_token }`. */
  refreshBody?: (refreshToken: string) => unknown;
  /** Extra headers on every backend call (an API key, a tenant id). */
  headers?: () => Record<string, string>;
};

export type AuthServerConfig = {
  /**
   * Prefix of the session cookies (`<prefix>_access`, `<prefix>_refresh`).
   * Two apps on the same host (localhost in development) need different
   * prefixes, since cookies ignore the port.
   */
  cookiePrefix: string;
  backend: AuthBackendConfig;
  /**
   * Backend path prefixes the `/api/backend/[...path]` proxy forwards with
   * the session token. Anything else is refused with 404, so the proxy can
   * never be used to reach an endpoint the app does not own.
   */
  proxyPrefixes: readonly string[];
  /** Request headers the proxy forwards to the backend. */
  forwardHeaders?: readonly string[];
  /** `Secure` on the cookies. Default: on in production builds; set `false` only for a plain-http staging host. */
  secureCookies?: boolean;
  /** The largest JSON body an auth route accepts, in bytes. Default 64 KiB. */
  maxAuthBodyBytes?: number;
  /** The largest body the proxy forwards, in bytes. Default 10 MiB; raise it for uploads. */
  maxProxyBodyBytes?: number;
  /** Fallback lifetimes when a token carries no `exp`. */
  maxAge?: { access?: number; refresh?: number };
  /** Deadline for backend calls made by the BFF, in ms. */
  timeoutMs?: number;
  /** Request-body schemas of the standard handlers; defaults are the `@dtos` auth schemas. */
  schemas?: Partial<{
    login: ZodType;
    register: ZodType;
    forgotPassword: ZodType;
    resetPassword: ZodType;
  }>;
};

/** Headers for anything that carries or depends on the session: never cacheable, never shared. */
export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie",
} as const;
