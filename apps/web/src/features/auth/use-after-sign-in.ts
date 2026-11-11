"use client";

import { useSearchParams } from "next/navigation";
import { getSafeNextPath } from "@utils";
import { useRouter } from "@/i18n/navigation";

/** Where to go after signing in: the same-origin `next` parameter, else the account page. */
export function useAfterSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  return () => {
    const next = getSafeNextPath(searchParams.get("next"), window.location.origin);
    // `next` already carries its locale segment when it came from the middleware.
    if (next !== "/") window.location.assign(next);
    else router.push("/account");
  };
}
