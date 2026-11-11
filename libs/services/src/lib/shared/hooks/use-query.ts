import {
  useQuery as useReactQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { queryGcTime } from "../query-gc-time";

const statusOf = (error: unknown): number =>
  typeof (error as { statusCode?: unknown })?.statusCode === "number"
    ? (error as { statusCode: number }).statusCode
    : 0;

/** The shared query defaults, for `useQueries` callers that cannot go through `useQuery`. */
export const QUERY_DEFAULTS = {
  // A 4xx or 5xx will not resolve itself; only network failures are retried.
  retry: (failureCount: number, error: unknown) => statusOf(error) < 400 && failureCount < 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000),
  staleTime: 5 * 60 * 1000,
  gcTime: queryGcTime(),
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  // A 5xx reaches the nearest error boundary; 4xx are handled where the data is used.
  throwOnError: (error: unknown) => statusOf(error) >= 500,
};

/**
 * `useQuery` with the workspace defaults. Domain hooks build on this, never
 * on TanStack's hook directly, so retry and error policy stay in one place.
 */
export function useQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  options: UseQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  return useReactQuery<TQueryFnData, TError, TData>({ ...QUERY_DEFAULTS, ...options });
}
