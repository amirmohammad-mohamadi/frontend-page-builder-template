"use client";

import {
  QueryClient,
  QueryClientProvider as ReactQueryClientProvider,
} from "@tanstack/react-query";
import { createContext, useContext, useState, type ReactNode } from "react";
import { isBrowserOffline } from "@utils";
import { queryGcTime } from "./query-gc-time";

/**
 * `"pause"` (TanStack's default): requests wait while the browser reports
 * offline. `"fail"`: they run anyway and fail at once, so a screen shows its
 * own error state instead of an endless spinner.
 */
export type QueryClientOfflineMode = "pause" | "fail";

const QUERY_RETRIES = 3;

/** The app's QueryClient: retries with backoff on queries, none on mutations, 5-minute staleTime. */
export function createQueryClient({
  offline = "pause",
}: { offline?: QueryClientOfflineMode } = {}): QueryClient {
  const failOffline = offline === "fail";
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: failOffline
          ? (count) => count < QUERY_RETRIES && !isBrowserOffline()
          : QUERY_RETRIES,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        staleTime: 5 * 60 * 1000,
        gcTime: queryGcTime(),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        ...(failOffline ? { networkMode: "always" as const } : {}),
      },
      mutations: {
        retry: false,
        ...(failOffline ? { networkMode: "always" as const } : {}),
      },
    },
  });
}

/**
 * The text a mutation's default error toast falls back to when the server
 * sent no usable message. Apps provide a translated string; the default is
 * English.
 */
const MutationErrorFallbackContext = createContext<string>(
  "Something went wrong. Please try again."
);

export function useMutationErrorFallback(): string {
  return useContext(MutationErrorFallbackContext);
}

type QueryClientProviderProps = {
  children: ReactNode;
  queryClient?: QueryClient;
  offline?: QueryClientOfflineMode;
  /** Fallback toast text for failed mutations, already translated. */
  mutationErrorFallback?: string;
};

/** Provides one QueryClient per browser session (created lazily, never on the server module scope). */
export function QueryClientProvider({
  children,
  queryClient,
  offline,
  mutationErrorFallback,
}: QueryClientProviderProps) {
  const [client] = useState(() => queryClient ?? createQueryClient({ offline }));
  const inner = <ReactQueryClientProvider client={client}>{children}</ReactQueryClientProvider>;
  return mutationErrorFallback ? (
    <MutationErrorFallbackContext.Provider value={mutationErrorFallback}>
      {inner}
    </MutationErrorFallbackContext.Provider>
  ) : (
    inner
  );
}
