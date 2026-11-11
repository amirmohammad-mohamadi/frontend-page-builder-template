"use client";

import { useCallback } from "react";
import { useCurrentUser } from "@services";
import { decideAccess, routePermissions, type AccessDecision } from "@/lib/permissions";

/**
 * Access checks over the current session. `checkRoute` decides navigation
 * (fails open when the backend sends no permissions); `can` decides actions
 * (fails closed while loading or without permissions).
 */
export function useAccess() {
  const { user, isLoading } = useCurrentUser();
  const status = isLoading ? "loading" : "ready";
  const permissions = user?.toJSON().permissions;

  const check = useCallback(
    (required: readonly string[] | null): AccessDecision =>
      decideAccess(required, status, permissions),
    [status, permissions]
  );

  const checkRoute = useCallback((pathname: string) => check(routePermissions(pathname)), [check]);

  const can = useCallback(
    (name: string | readonly string[]): boolean => {
      if (!user) return false;
      return typeof name === "string" ? user.hasPermission(name) : user.hasAnyPermission(name);
    },
    [user]
  );

  return { status, check, checkRoute, can, user };
}
