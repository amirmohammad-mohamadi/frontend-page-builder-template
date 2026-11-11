import { ApiClientError, retryAfterHeaderSeconds } from "./api-errors";
import { getBackendAdapter } from "./backend-adapter";

/**
 * Same-origin JSON calls to the app's own route handlers under `/api/`
 * (the BFF). These never carry a backend token; the session lives in
 * httpOnly cookies the routes manage. Failures throw `ApiClientError` like
 * every `apiClient` call, so one error path serves both.
 */
export async function bffRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...init.headers },
      cache: "no-store",
    });
  } catch (error) {
    throw ApiClientError.network(error instanceof Error ? error.message : "Network error");
  }
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiClientError(
      getBackendAdapter().readError(body, response.status, response.statusText),
      retryAfterHeaderSeconds(response)
    );
  }
  return getBackendAdapter().unwrap<T>(body);
}

export const bffClient = {
  get: <T>(url: string) => bffRequest<T>(url, { method: "GET" }),
  post: <T>(url: string, data?: unknown) =>
    bffRequest<T>(url, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
};
