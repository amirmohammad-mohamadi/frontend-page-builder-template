"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { API_FORBIDDEN_EVENT, API_UNAUTHORIZED_EVENT, authQueryKeys } from "@services";
import { PUBLIC_PATHS } from "@/lib/auth/config";
import { TEXTS } from "@/texts";

/**
 * A 401 from any call ends the session: clear the client state and send the
 * operator to sign in. A 403 means the operator's permissions may have
 * changed since the shell read them: refetch the session so navigation and
 * `<Can>` follow.
 */
export function AuthEventHandler() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onUnauthorized = () => {
      queryClient.setQueryData(authQueryKeys.me(), null);
      if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return;
      toast.error(TEXTS.auth.sessionExpired);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    };
    const onForbidden = () => {
      toast.error(TEXTS.common.forbidden);
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.me() });
    };
    window.addEventListener(API_UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener(API_FORBIDDEN_EVENT, onForbidden);
    return () => {
      window.removeEventListener(API_UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener(API_FORBIDDEN_EVENT, onForbidden);
    };
  }, [queryClient, router, pathname]);

  return null;
}
