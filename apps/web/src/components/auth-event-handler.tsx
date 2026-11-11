"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_UNAUTHORIZED_EVENT, authQueryKeys } from "@services";

/**
 * When any API call answers 401 the session is gone (the BFF already cleared
 * the cookies). Marking the session query as signed out updates the header
 * and every guarded screen at once; pages that need a session redirect on
 * their own.
 */
export function AuthEventHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const onUnauthorized = () => {
      queryClient.setQueryData(authQueryKeys.me(), null);
    };
    window.addEventListener(API_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(API_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  return null;
}
