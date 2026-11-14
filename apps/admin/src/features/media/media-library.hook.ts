"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import type { MediaAssetModel } from "@models";
import { useDeleteMediaAsset, useMediaAssets, useUploadMedia } from "@services";
import { captureError, QueryParamBuilder, useDebounce } from "@utils";
import { TEXTS, fill } from "@/texts";

/** Files per page in the library grid. */
const PER_PAGE = 24;

/** URL-driven grid state plus the upload, edit, delete and copy flows; the grid only renders. */
export function useMediaLibrary() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debouncedSearch = useDebounce(search);
  const [editing, setEditing] = useState<MediaAssetModel | null>(null);
  const [deleting, setDeleting] = useState<MediaAssetModel | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadsInFlight, setUploadsInFlight] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const query = useMediaAssets({ page, per_page: PER_PAGE, search: debouncedSearch || undefined });
  const upload = useUploadMedia();
  const remove = useDeleteMediaAsset({
    onSuccess: () => {
      toast.success(TEXTS.media.deleted);
      setDeleting(null);
    },
  });

  const updateUrl = (changes: Record<string, string | number | null>) => {
    const builder = new QueryParamBuilder(searchParams.toString(), { page: "1" });
    for (const [key, value] of Object.entries(changes)) builder.set(key, value);
    router.replace(`?${builder.removeDefaults().toStringRaw()}`);
  };

  /** Uploads each file on its own, so one refusal does not stop the rest. */
  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadsInFlight((count) => count + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const media = await upload.mutateAsync({ file });
          toast.success(fill(TEXTS.media.uploaded, { name: media.name }));
        } catch (error) {
          // The mutation hook has shown the server's message; name the file too.
          captureError(error, { area: "media-upload" });
          toast.error(fill(TEXTS.media.uploadFailed, { name: file.name }));
        } finally {
          setUploadsInFlight((count) => count - 1);
        }
      })
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    event.target.value = "";
    if (files) void uploadFiles(files);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFiles(event.dataTransfer.files);
  };

  const copyUrl = async (item: MediaAssetModel) => {
    try {
      await navigator.clipboard.writeText(item.getUrl());
      toast.success(TEXTS.media.copied);
    } catch (error) {
      captureError(error, { area: "media-copy-url" });
    }
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
    fileInputRef,
    openFilePicker: () => fileInputRef.current?.click(),
    handleFileChange,
    dragging,
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (!dragging) setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop: handleDrop,
    isUploading: uploadsInFlight > 0,
    editing,
    openEdit: (item: MediaAssetModel) => setEditing(item),
    closeEdit: () => setEditing(null),
    deleting,
    askDelete: (item: MediaAssetModel) => setDeleting(item),
    cancelDelete: () => setDeleting(null),
    confirmDelete: () => deleting && remove.mutate(deleting.getId()),
    isDeleting: remove.isPending,
    copyUrl,
  };
}
