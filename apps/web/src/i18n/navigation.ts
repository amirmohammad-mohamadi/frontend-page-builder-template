import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware `Link`, `redirect`, `usePathname` and `useRouter`. Use these, never `next/link` directly. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
