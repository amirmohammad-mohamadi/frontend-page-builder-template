"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { QueryParamBuilder, useDebounce } from "@utils";
import type { ListExamplesQueryDto } from "@dtos";
import { useExamples } from "@services";

/**
 * The feature hook: turns URL state into a query and exposes what the
 * presentational component needs. The component below renders only.
 */
export function useExamplesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const status = (searchParams.get("status") ?? undefined) as ListExamplesQueryDto["status"];
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(search);

  const query = useExamples({ page, per_page: 10, search: debouncedSearch || undefined, status });

  const updateUrl = (changes: Record<string, string | number | null>) => {
    const builder = new QueryParamBuilder(searchParams.toString(), { page: "1" });
    for (const [key, value] of Object.entries(changes)) builder.set(key, value);
    router.replace(`?${builder.removeDefaults().toStringRaw()}`);
  };

  return {
    query,
    page,
    status: status ?? "all",
    search,
    setSearch: (value: string) => {
      setSearch(value);
      updateUrl({ search: value || null, page: null });
    },
    setStatus: (value: string) => updateUrl({ status: value === "all" ? null : value, page: null }),
    setPage: (value: number) => updateUrl({ page: value }),
  };
}
