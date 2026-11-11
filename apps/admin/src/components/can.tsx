"use client";

import type { ReactNode } from "react";
import { useAccess } from "@/hooks/use-access";

/** Renders `children` only when the operator holds `permission` (any of a list); `fallback` otherwise. Fails closed. */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: string | readonly string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = useAccess();
  return <>{can(permission) ? children : fallback}</>;
}
