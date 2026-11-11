import { ApiClientError, formatApiErrorDescription, isClientRejection } from "./api-errors";

/** What a form shows for a failed request: the backend's message for a refused request, `fallback` otherwise, plus field details. */
export function describeApiError(
  error: unknown,
  fallback: string
): { message: string; details: string } | null {
  if (!error) return null;
  const message = isClientRejection(error) ? error.message : fallback;
  const details =
    error instanceof ApiClientError ? formatApiErrorDescription(error.errors, " · ") : "";
  return { message, details: details && details !== message ? details : "" };
}
