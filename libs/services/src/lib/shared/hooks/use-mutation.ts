import {
  useMutation as useReactMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiClientError, formatApiErrorDescription, isClientRejection } from "../api-errors";
import { useMutationErrorFallback } from "../query-client-provider";

/**
 * The default error toast text: the server's message for a refused request
 * (a 4xx, worded for the user), else `fallback`. A request with no answer
 * carries the browser's English text and a 5xx the server's, so both show
 * the fallback.
 */
export function defaultMutationErrorText(error: unknown, fallback: string): string {
  if (!isClientRejection(error)) return fallback;
  return error.message.trim() || fallback;
}

export type UseMutationOptionsWithToastControl<TData, TError, TVariables, TContext> =
  UseMutationOptions<TData, TError, TVariables, TContext> & {
    /** Skip the default error toast, when the caller shows its own error UI. A predicate decides per error. */
    suppressDefaultErrorToast?: boolean | ((error: TError) => boolean);
  };

/**
 * `useMutation` with the workspace defaults: writes are never retried (a
 * timed-out write may have been applied), and a failure shows one toast
 * unless the caller suppresses it.
 */
export function useMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptionsWithToastControl<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { suppressDefaultErrorToast, ...mutationOptions } = options;
  const fallback = useMutationErrorFallback();
  return useReactMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    retry: false,
    onError: (error, variables, context, mutation) => {
      options.onError?.(error, variables, context, mutation);
      const suppress =
        typeof suppressDefaultErrorToast === "function"
          ? suppressDefaultErrorToast(error)
          : suppressDefaultErrorToast;
      if (suppress) return;
      toast.error(defaultMutationErrorText(error, fallback), {
        description:
          error instanceof ApiClientError ? formatApiErrorDescription(error.errors) : undefined,
      });
    },
  });
}
