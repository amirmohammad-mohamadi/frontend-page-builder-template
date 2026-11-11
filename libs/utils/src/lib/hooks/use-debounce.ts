"use client";

import { useEffect, useState } from "react";

/** Returns `value` once it has stayed unchanged for `delay` ms, for search inputs and similar. */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
