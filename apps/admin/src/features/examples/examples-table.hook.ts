"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { ExampleModel } from "@models";
import { useDeleteExample, useExamples } from "@services";
import { QueryParamBuilder, useDebounce } from "@utils";
import { TEXTS } from "@/texts";

/** URL-driven list state plus the delete flow; the table component only renders. */
export function useExamplesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(search);
  const [editing, setEditing] = useState<ExampleModel | null | "new">(null);
  const [deleting, setDeleting] = useState<ExampleModel | null>(null);

  const query = useExamples({ page, per_page: 10, search: debouncedSearch || undefined });
  const remove = useDeleteExample({
    onSuccess: () => {
      toast.success(TEXTS.examples.deleted);
      setDeleting(null);
    },
  });

  const updateUrl = (changes: Record<string, string | number | null>) => {
    const builder = new QueryParamBuilder(searchParams.toString(), { page: "1" });
    for (const [key, value] of Object.entries(changes)) builder.set(key, value);
    router.replace(`?${builder.removeDefaults().toStringRaw()}`);
  };

  return {
    query,
    page,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      updateUrl({ search: value || null, page: null });
    },
    setPage: (value: number) => updateUrl({ page: value }),
    editing,
    openCreate: () => setEditing("new"),
    openEdit: (item: ExampleModel) => setEditing(item),
    closeForm: () => setEditing(null),
    deleting,
    askDelete: (item: ExampleModel) => setDeleting(item),
    cancelDelete: () => setDeleting(null),
    confirmDelete: () => deleting && remove.mutate(deleting.getId()),
    isDeleting: remove.isPending,
  };
}
