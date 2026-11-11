import type { ApiErrorDto } from "@dtos";

/** Thrown by `apiClient` and the BFF client for every failed request. */
export class ApiClientError extends Error {
  statusCode: number;
  /** Field-keyed validation messages, when the backend sent any. */
  errors?: Record<string, string[]>;
  /** The backend's own error code, when it sent one. */
  code?: number | string;
  /** Seconds to wait, from a 429's `Retry-After` header. */
  retryAfter?: number;

  constructor(dto: ApiErrorDto, retryAfter?: number) {
    super(dto.message);
    this.name = "ApiClientError";
    this.statusCode = dto.statusCode ?? 0;
    this.errors = dto.errors;
    this.code = dto.code;
    this.retryAfter = retryAfter;
  }

  /** A request that never got an HTTP answer (offline, DNS, aborted, timeout). */
  static network(message: string, code?: string): ApiClientError {
    return new ApiClientError({ message, statusCode: 0, code });
  }
}

/** Whether `error` is a refused request (4xx) whose message the backend wrote for the user. */
export function isClientRejection(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError && error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * The `Retry-After` of a 429 in whole seconds: a delta as it is, an HTTP date
 * measured from now; `undefined` without the header or for a non-positive wait.
 */
export function retryAfterHeaderSeconds(response: Response): number | undefined {
  const header = response.status === 429 ? response.headers.get("Retry-After") : null;
  if (!header) return undefined;
  const delta = /^\d+$/.test(header.trim())
    ? Number(header)
    : Math.ceil((Date.parse(header) - Date.now()) / 1000);
  return Number.isFinite(delta) && delta > 0 ? delta : undefined;
}

/** Joins a field-keyed error bag into one description, one field per line. */
export function formatApiErrorDescription(
  errors: Record<string, string[]> | undefined,
  separator = "\n"
): string {
  if (!errors) return "";
  return Object.values(errors)
    .map((messages) => messages.join(", "))
    .filter(Boolean)
    .join(separator);
}
