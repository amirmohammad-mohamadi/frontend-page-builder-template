"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { PageModel } from "@models";
import { useDeletePage, usePages, usePublishPage, useUnpublishPage } from "@services";
import { QueryParamBuilder, useDebounce } from "@utils";
import { DEFAULT_CONTENT_LOCALE } from "@/config/locale";
import { env } from "@/env";
import { TEXTS } from "@/texts";

/** A row action awaiting confirmation. */
export type PendingAction = { kind: "publish" | "unpublish" | "delete"; page: PageModel };

/** URL-driven list state plus the create, publish, unpublish and delete flows; the table only renders. */
export function usePagesTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(search);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const query = usePages({ page, per_page: 20, search: debouncedSearch || undefined });

  const settle = (message: string) => () => {
    toast.success(message);
    setPending(null);
  };
  const publish = usePublishPage({ onSuccess: settle(TEXTS.pages.published) });
  const unpublish = useUnpublishPage({ onSuccess: settle(TEXTS.pages.unpublished) });
  const remove = useDeletePage({ onSuccess: settle(TEXTS.pages.deleted) });

  const updateUrl = (changes: Record<string, string | number | null>) => {
    const builder = new QueryParamBuilder(searchParams.toString(), { page: "1" });
    for (const [key, value] of Object.entries(changes)) builder.set(key, value);
    router.replace(`?${builder.removeDefaults().toStringRaw()}`);
  };

  const confirmPending = () => {
    if (!pending) return;
    const id = pending.page.getId();
    if (pending.kind === "publish") publish.mutate(id);
    else if (pending.kind === "unpublish") unpublish.mutate(id);
    else remove.mutate(id);
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
    creating,
    openCreate: () => setCreating(true),
    closeCreate: () => setCreating(false),
    /** After a create the new page opens in the builder. */
    openBuilder: (item: PageModel) => router.push(`/builder/${item.getId()}`),
    openPreview: (item: PageModel) => {
      const url = `${env.NEXT_PUBLIC_WEB_APP_URL}/${DEFAULT_CONTENT_LOCALE}/preview/${item.getSlug()}`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    pending,
    ask: (kind: PendingAction["kind"], item: PageModel) => setPending({ kind, page: item }),
    cancelPending: () => setPending(null),
    confirmPending,
    isActing: publish.isPending || unpublish.isPending || remove.isPending,
  };
}
