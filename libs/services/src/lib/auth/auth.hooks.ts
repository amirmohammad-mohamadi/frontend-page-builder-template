"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { SessionUserDto } from "@dtos";
import { UserModel } from "@models";
import { setErrorReportingUser } from "@utils";
import { ApiClientError } from "../shared/api-errors";
import { useMutation } from "../shared/hooks/use-mutation";
import { useQuery } from "../shared/hooks/use-query";
import { authApi } from "./auth.api";
import { authQueryKeys } from "./auth.query-keys";

type SessionAnswer = { user: SessionUserDto | null };

/**
 * The current session: `user` is a `UserModel` when signed in, `null` when
 * there is no session, `undefined` while loading. The query is the single
 * source of truth for "who is signed in" on the client; sign-in and sign-out
 * mutations write into it.
 */
export function useCurrentUser(options: { enabled?: boolean } = {}) {
  const query = useQuery<SessionAnswer | null, ApiClientError, UserModel | null>({
    queryKey: authQueryKeys.me(),
    queryFn: async () => {
      const answer = await authApi.me();
      setErrorReportingUser(answer.user ? String(answer.user.id) : null);
      return answer;
    },
    select: (data) => (data?.user ? new UserModel(data.user) : null),
    staleTime: 60 * 1000,
    enabled: options.enabled,
  });
  return { ...query, user: query.data, isSignedIn: query.data != null };
}

/** Writes a sign-in answer into the session query so the UI updates without a refetch. */
function useSetSession() {
  const queryClient = useQueryClient();
  return (answer: SessionAnswer | null) => {
    queryClient.setQueryData(authQueryKeys.me(), answer);
    setErrorReportingUser(answer?.user ? String(answer.user.id) : null);
    if (answer === null) queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
  };
}

export function useLogin(options: { onSuccess?: (user: UserModel) => void } = {}) {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: authApi.login,
    suppressDefaultErrorToast: true,
    onSuccess: (answer) => {
      setSession(answer);
      options.onSuccess?.(new UserModel(answer.user));
    },
  });
}

export function useRegister(options: { onSuccess?: (user: UserModel) => void } = {}) {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: authApi.register,
    suppressDefaultErrorToast: true,
    onSuccess: (answer) => {
      setSession(answer);
      options.onSuccess?.(new UserModel(answer.user));
    },
  });
}

export function useLogout(options: { onSuccess?: () => void } = {}) {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setSession(null);
      options.onSuccess?.();
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword, suppressDefaultErrorToast: true });
}

export function useResetPassword(options: { onSuccess?: (user: UserModel) => void } = {}) {
  const setSession = useSetSession();
  return useMutation({
    mutationFn: authApi.resetPassword,
    suppressDefaultErrorToast: true,
    onSuccess: (answer) => {
      setSession(answer);
      options.onSuccess?.(new UserModel(answer.user));
    },
  });
}
