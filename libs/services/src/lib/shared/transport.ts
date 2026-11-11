import { configureApiClientTransport, type ApiClientTransport } from "./api-client";

export type ApiTransportOptions = {
  /** Backend origin the browser calls directly for public endpoints. */
  publicBaseUrl: string;
  /** Backend origin the server calls (SSR, route handlers). */
  internalBaseUrl: string;
  /** Backend path prefixes the app's `/api/backend` proxy forwards with the session token. */
  proxyPrefixes: readonly string[];
  /** Extra request headers, for example an `Accept-Language` read from the document. */
  headers?: () => Record<string, string>;
};

const trim = (url: string) => url.replace(/\/$/, "");

/**
 * The transport both apps use. In the browser, paths the BFF proxy owns go
 * through `/api/backend` (the proxy adds the session token from the httpOnly
 * cookie) and public paths go straight to the backend. On the server every
 * path goes to the internal backend origin with no token.
 */
export function createApiTransport(options: ApiTransportOptions): ApiClientTransport {
  const isProxied = (path: string) =>
    options.proxyPrefixes.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)
    );
  return {
    resolveUrl: (path) => {
      if (typeof window === "undefined") return `${trim(options.internalBaseUrl)}${path}`;
      return isProxied(path) ? `/api/backend${path}` : `${trim(options.publicBaseUrl)}${path}`;
    },
    getAuthToken: () => null,
    headers: options.headers,
  };
}

/** Builds the transport and installs it; the module that calls this is imported once per runtime. */
export function installApiTransport(options: ApiTransportOptions): void {
  configureApiClientTransport(createApiTransport(options));
}

/** `Accept-Language` from the document's `lang`, for localized backends; nothing on the server. */
export function documentLanguageHeaders(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const locale = document.documentElement.lang;
  return locale ? { "Accept-Language": locale } : {};
}
