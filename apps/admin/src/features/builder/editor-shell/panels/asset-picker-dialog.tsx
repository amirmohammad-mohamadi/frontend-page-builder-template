"use client";

import { PlayIcon, UploadIcon } from "lucide-react";
import type { MediaAssetModel } from "@models";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Skeleton,
} from "@components";
import { cn } from "@utils";
import type {
  AssetPickerController,
  AssetPickerMediaType,
} from "@/grapesjs/editor/asset-picker-controller";
import { TEXTS } from "@/texts";
import { useAssetPickerBody, useAssetPickerDialog } from "./asset-picker-dialog.hook";

const t = TEXTS.builder.assetPicker;

type Props = {
  controller: AssetPickerController;
};

/**
 * The core shell's media picker: the Asset Manager opens it through `assetManager.custom`
 * (file traits' Browse buttons) and it lists the media library. Mounted once by the shell.
 */
export function AssetPickerDialog({ controller }: Props) {
  const vm = useAssetPickerDialog({ controller });

  return (
    <Dialog open={vm.open} onOpenChange={vm.onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-3 sm:max-w-3xl">
        {vm.shownRequest ? (
          <AssetPickerBody key={vm.shownRequest.openId} request={vm.shownRequest} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type BodyProps = Parameters<typeof useAssetPickerBody>[0];

/** Header, toolbar, grid and footer for one picker request; remounted per open. */
function AssetPickerBody({ request }: BodyProps) {
  const vm = useAssetPickerBody({ request });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t.title}</DialogTitle>
        <DialogDescription>{describe(vm.accepted)}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          aria-label={t.searchLabel}
          placeholder={t.searchPlaceholder}
          value={vm.search}
          onChange={(event) => vm.setSearch(event.target.value)}
          className="min-w-40 flex-1"
        />
        {vm.accepted.length > 1 ? (
          <div role="group" aria-label={t.filterLabel} className="flex gap-1">
            {renderFilterButton(t.filterAll, vm.typeFilter === undefined, () =>
              vm.setTypeFilter(undefined)
            )}
            {renderFilterButton(t.filterImage, vm.typeFilter === "image", () =>
              vm.setTypeFilter("image")
            )}
            {renderFilterButton(t.filterVideo, vm.typeFilter === "video", () =>
              vm.setTypeFilter("video")
            )}
          </div>
        ) : null}
        <Button
          type="button"
          onClick={() => vm.fileInputRef.current?.click()}
          disabled={vm.isUploading}
          aria-busy={vm.isUploading}
        >
          <UploadIcon />
          {vm.isUploading ? t.uploading : t.upload}
        </Button>
        <input
          ref={vm.fileInputRef}
          type="file"
          aria-label={t.uploadLabel}
          accept={vm.uploadAccept}
          className="hidden"
          onChange={vm.handleFileChange}
        />
      </div>

      <div className="-mx-1 min-h-48 flex-1 overflow-y-auto px-1 py-1">
        {vm.isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        ) : vm.isError ? (
          <p role="alert" className="text-destructive py-12 text-center text-sm">
            {t.error}
          </p>
        ) : vm.items.length === 0 && !vm.hasNextPage ? (
          <p className="text-muted-foreground py-12 text-center text-sm">{t.empty}</p>
        ) : (
          <>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {vm.items.map((media) => (
                <li key={String(media.getId())}>
                  {renderTile(
                    media,
                    vm.selected?.getId() === media.getId(),
                    () => vm.setSelected(media),
                    () => vm.pick(media)
                  )}
                </li>
              ))}
            </ul>
            {vm.hasNextPage ? (
              <div className="flex justify-center pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={vm.loadNextPage}
                  disabled={vm.isFetchingNextPage}
                  aria-busy={vm.isFetchingNextPage}
                >
                  {vm.isFetchingNextPage ? t.loadingMore : t.loadMore}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <DialogFooter className="items-center sm:justify-between">
        <p className="text-muted-foreground truncate text-sm">
          {vm.selected?.getName() || t.nothingSelected}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => request.close()}>
            {t.cancel}
          </Button>
          <Button type="button" onClick={vm.confirm} disabled={!vm.selected}>
            {t.select}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

/** The dialog description for the accepted media kinds. */
function describe(accepted: readonly AssetPickerMediaType[]) {
  if (accepted.length > 1) return t.descriptionAny;
  return accepted[0] === "video" ? t.descriptionVideo : t.descriptionImage;
}

/** One pressed-state button of the type filter. */
function renderFilterButton(label: string, active: boolean, onClick: () => void) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

/** A media tile: a click selects it, a double-click picks it straight away. */
function renderTile(
  media: MediaAssetModel,
  selected: boolean,
  onSelect: () => void,
  onPick: () => void
) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      title={media.getName()}
      onClick={onSelect}
      onDoubleClick={onPick}
      className={cn(
        "group bg-muted focus-visible:ring-ring relative block aspect-square w-full overflow-hidden rounded-md border outline-none focus-visible:ring-2",
        selected && "ring-primary ring-offset-background ring-2 ring-offset-2"
      )}
    >
      {media.isVideo() ? (
        <>
          <video
            src={media.getUrl()}
            preload="metadata"
            muted
            playsInline
            className="size-full object-cover"
          />
          <PlayIcon className="absolute start-1.5 top-1.5 size-4 text-white drop-shadow" />
        </>
      ) : (
        // Media lives on any host; next/image would need every origin listed.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.getUrl()}
          alt={media.getName()}
          loading="lazy"
          className="size-full object-cover"
        />
      )}
      <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1.5 py-0.5 text-start text-xs text-white">
        {media.getName()}
      </span>
    </button>
  );
}
