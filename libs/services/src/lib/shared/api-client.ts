import { captureError } from "@utils";
import { ApiClientError, retryAfterHeaderSeconds } from "./api-errors";
import { getBackendAdapter } from "./backend-adapter";
import type { NormalizedList } from "./types";

/**
 * How requests reach the backend. Each app configures this once at start
 * (browser and server may differ):
 * - `resolveUrl` maps an endpoint path to the URL to fetch. Apps route
 *   authenticated paths through their same-origin BFF proxy and public paths
 *   straight to the backend.
 * - `getAuthToken` returns a Bearer token to attach, or `null`. With the BFF
 *   pattern the browser never holds a token, so it stays `null` there.
 * - `headers` adds request headers (a locale, a tenant id, a tracing id).
 */
export type ApiClientTransport = {
  resolveUrl?: (path: string) => string;
  getAuthToken?: () => string | null;
  headers?: () => Record<string, string>;
};

let transport: ApiClientTransport = {};

/** Installs the app's transport. Call once from a module both the browser and the server import. */
export function configureApiClientTransport(next: ApiClientTransport): void {
  transport = next;
}

/** Window events dispatched on a browser-side 401 and 403, for the app's auth state to react to. */
export const API_UNAUTHORIZED_EVENT = "api:unauthorized";
export const API_FORBIDDEN_EVENT = "api:forbidden";

/** `code` of an `ApiClientError` this client raised itself (statusCode 0). */
export const CLIENT_ERROR_CODES = {
  REQUEST_TIMEOUT: "request_timeout",
  NETWORK: "network_error",
} as const;

/** Server-side requests get a deadline so a stuck backend cannot keep renders alive. */
export const SERVER_FETCH_TIMEOUT_MS = 10_000;

export type ApiRequestOptions = RequestInit & {
  /** Server only: this call's deadline in ms instead of `SERVER_FETCH_TIMEOUT_MS`. */
  timeoutMs?: number;
  /** Set to `false` to leave `Content-Type` unset (FormData uploads). */
  json?: boolean;
};

const isServer = () => typeof window === "undefined";

function announceAuthRejection(status: number): void {
  if (isServer()) return;
  if (status === 401) window.dispatchEvent(new CustomEvent(API_UNAUTHORIZED_EVENT));
  if (status === 403) window.dispatchEvent(new CustomEvent(API_FORBIDDEN_EVENT));
}

/** A request's abort signal that also fires after `timeoutMs` on the server. */
function withDeadline(signal: AbortSignal | null | undefined, timeoutMs: number | undefined) {
  if (!isServer())
    return { signal: signal ?? undefined, clear: () => undefined, timedOut: () => false };
  const ms =
    timeoutMs && Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : SERVER_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  const follow = () => controller.abort(signal?.reason);
  if (signal?.aborted) follow();
  else signal?.addEventListener("abort", follow, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException(`No answer within ${ms} ms`, "TimeoutError"));
  }, ms);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    clear: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", follow);
    },
  };
}

class ApiClient {
  private resolveUrl(path: string): string {
    return transport.resolveUrl ? transport.resolveUrl(path) : path;
  }

  private buildHeaders(options: ApiRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options.json === false ? {} : { "Content-Type": "application/json" }),
      ...transport.headers?.(),
      ...(options.headers as Record<string, string> | undefined),
    };
    const token = transport.getAuthToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(
    path: string,
    options: ApiRequestOptions = {},
    parse: "json" | "blob" = "json"
  ): Promise<T> {
    const { timeoutMs, json: _json, ...init } = options;
    const deadline = withDeadline(init.signal, timeoutMs);
    const url = this.resolveUrl(path);
    try {
      const response = await fetch(url, {
        ...init,
        headers: this.buildHeaders(options),
        credentials: "include",
        // The browser must never answer from its HTTP cache: react-query owns caching there.
        ...(isServer() ? {} : { cache: "no-store" as const }),
        signal: deadline.signal,
      });
      if (!response.ok) {
        announceAuthRejection(response.status);
        const body = await response.json().catch(() => undefined);
        const dto = getBackendAdapter().readError(body, response.status, response.statusText);
        throw new ApiClientError(dto, retryAfterHeaderSeconds(response));
      }
      if (parse === "blob") return (await response.blob()) as T;
      if (response.status === 204) return undefined as T;
      return getBackendAdapter().unwrap<T>(await response.json());
    } catch (caught) {
      const error =
        caught instanceof ApiClientError
          ? caught
          : deadline.timedOut()
            ? ApiClientError.network("The request timed out", CLIENT_ERROR_CODES.REQUEST_TIMEOUT)
            : ApiClientError.network(
                caught instanceof Error ? caught.message : "Network error",
                CLIENT_ERROR_CODES.NETWORK
              );
      captureError(error, {
        request: `${(init.method ?? "GET").toUpperCase()} ${url}`,
        statusCode: error.statusCode,
        code: error.code,
        // Field names only, never submitted values.
        errorFields: error.errors ? Object.keys(error.errors) : undefined,
      });
      throw error;
    } finally {
      deadline.clear();
    }
  }

  get<T>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  /** A paginated list, normalised by the backend adapter. */
  async getList<T>(path: string, options?: ApiRequestOptions): Promise<NormalizedList<T>> {
    const { timeoutMs, json: _json, ...init } = options ?? {};
    const deadline = withDeadline(init.signal, timeoutMs);
    const url = this.resolveUrl(path);
    try {
      const response = await fetch(url, {
        ...init,
        method: "GET",
        headers: this.buildHeaders(options ?? {}),
        credentials: "include",
        ...(isServer() ? {} : { cache: "no-store" as const }),
        signal: deadline.signal,
      });
      if (!response.ok) {
        announceAuthRejection(response.status);
        const body = await response.json().catch(() => undefined);
        throw new ApiClientError(
          getBackendAdapter().readError(body, response.status, response.statusText),
          retryAfterHeaderSeconds(response)
        );
      }
      return getBackendAdapter().readList<T>(await response.json());
    } catch (caught) {
      const error =
        caught instanceof ApiClientError
          ? caught
          : ApiClientError.network(
              caught instanceof Error ? caught.message : "Network error",
              CLIENT_ERROR_CODES.NETWORK
            );
      captureError(error, { request: `GET ${url}`, statusCode: error.statusCode });
      throw error;
    } finally {
      deadline.clear();
    }
  }

  post<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  }

  put<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PUT", body: JSON.stringify(data) });
  }

  patch<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(data) });
  }

  delete<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "DELETE",
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    });
  }

  /** Multipart upload; the browser sets the boundary header itself. */
  upload<T>(path: string, formData: FormData, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "POST", body: formData, json: false });
  }

  /** A binary response (a file download) as a Blob. */
  getBlob(path: string, options?: ApiRequestOptions): Promise<Blob> {
    return this.request<Blob>(path, { ...options, method: "GET", json: false }, "blob");
  }
}

export const apiClient = new ApiClient();
