"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { MediaAssetModel } from "@models";
import { useMediaAssets, useUploadMedia } from "@services";
import { useDebounce } from "@utils";
import {
  resolveAssetPick,
  toAcceptedTypes,
  type AssetPickerController,
  type AssetPickerMediaType,
  type AssetPickerRequest,
} from "@/grapesjs/editor/asset-picker-controller";
import { MEDIA_PAGE_SIZE } from "@/grapesjs/editor/asset-provider";
import { TEXTS, fill } from "@/texts";

/** The `accept` of the upload input per media kind. */
export const MEDIA_UPLOAD_ACCEPT: Record<AssetPickerMediaType, string> = {
  image: "image/*",
  video: "video/*",
};

const mediaType = (media: MediaAssetModel): AssetPickerMediaType =>
  media.isVideo() ? "video" : "image";

const isAcceptedMedia = (media: MediaAssetModel, accepted: readonly AssetPickerMediaType[]) =>
  accepted.includes(mediaType(media));

type DialogProps = {
  controller: AssetPickerController;
};

/**
 * Open state of the core shell's media picker, read from the Asset Manager controller. The last
 * request stays rendered while the dialog animates out; closing goes back through core
 * (`request.close()`), so the `open-assets` command is stopped and the next open runs again.
 */
export const useAssetPickerDialog = ({ controller }: DialogProps) => {
  const request = useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => null);
  const [shownRequest, setShownRequest] = useState<AssetPickerRequest | null>(request);
  if (request && request !== shownRequest) setShownRequest(request);

  const onOpenChange = (open: boolean) => {
    if (!open) request?.close();
  };

  return { open: !!request, shownRequest, onOpenChange };
};

type BodyProps = {
  request: AssetPickerRequest;
};

/**
 * One picker request: the media library filtered to the accepted kinds, with server search,
 * 40-per-page "load more" paging and upload (an accepted upload becomes the selection). Select
 * hands the chosen item back to the caller and closes; a double-click picks at once.
 */
export const useAssetPickerBody = ({ request }: BodyProps) => {
  const [accepted] = useState(() => toAcceptedTypes(request.types));
  const [selected, setSelected] = useState<MediaAssetModel | null>(null);
  const [typeFilter, setTypeFilter] = useState<AssetPickerMediaType | undefined>(
    accepted.length === 1 ? accepted[0] : undefined
  );
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<MediaAssetModel[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A new search starts the list again from its first page.
  useEffect(() => {
    setPage(1);
    setLoaded([]);
  }, [debouncedSearch]);

  const query = useMediaAssets({
    page,
    per_page: MEDIA_PAGE_SIZE,
    search: debouncedSearch || undefined,
  });
  const paginate = query.data?.getPaginate();

  // Pages accumulate as "load more" is pressed; an item already shown is not shown twice.
  // Keyed on `dataUpdatedAt`: the hook's `select` builds a new model on every render, so
  // depending on `query.data` itself would re-run this on every render and never settle.
  const dataUpdatedAt = query.dataUpdatedAt;
  useEffect(() => {
    const items = query.data?.getItems();
    if (!items) return;
    setLoaded((current) => {
      const seen = new Set(current.map((item) => String(item.getId())));
      const fresh = items.filter((item) => !seen.has(String(item.getId())));
      return fresh.length ? [...current, ...fresh] : current;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt, page, debouncedSearch]);

  const upload = useUploadMedia({
    onSuccess: (media) => {
      toast.success(fill(TEXTS.media.uploaded, { name: media.getName() }));
      setLoaded((current) => [media, ...current.filter((item) => item.getId() !== media.getId())]);
      if (isAcceptedMedia(media, accepted)) setSelected(media);
    },
  });

  const items = loaded.filter(
    (media) => isAcceptedMedia(media, accepted) && (!typeFilter || mediaType(media) === typeFilter)
  );
  const hasNextPage = !!paginate && paginate.getHasNextPage();

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) upload.mutate({ file });
    },
    [upload]
  );

  const pick = (media: MediaAssetModel | null) => {
    if (!media) return;
    resolveAssetPick(request, {
      src: media.getUrl(),
      name: media.getName(),
      type: mediaType(media),
    });
  };

  return {
    accepted,
    items,
    selected,
    setSelected,
    pick,
    confirm: () => pick(selected),
    uploadAccept: accepted.map((type) => MEDIA_UPLOAD_ACCEPT[type]).join(","),
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    isLoading: query.isPending && loaded.length === 0,
    isError: query.isError,
    hasNextPage,
    isFetchingNextPage: query.isFetching && page > 1,
    loadNextPage: () => {
      if (hasNextPage && !query.isFetching) setPage((current) => current + 1);
    },
    fileInputRef,
    handleFileChange,
    isUploading: upload.isPending,
  };
};
