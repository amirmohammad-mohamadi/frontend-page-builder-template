"use client";

import { CopyIcon, MoreHorizontalIcon, PlayIcon, UploadIcon } from "lucide-react";
import type { MediaAssetModel } from "@models";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Skeleton,
} from "@components";
import { cn, formatFileSize } from "@utils";
import { ADMIN_LOCALE, DEFAULT_CONTENT_LOCALE } from "@/config/locale";
import { PageHeader } from "@/components/page-header";
import { TEXTS, fill } from "@/texts";
import { MediaEditDialog } from "./media-edit-dialog";
import { useMediaLibrary } from "./media-library.hook";

const t = TEXTS.media;

/** The media library: upload (button and drop zone), the asset grid, search, edit and delete. */
export function MediaLibrary() {
  const vm = useMediaLibrary();
  const list = vm.query.data;
  const paginate = list?.getPaginate();

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button onClick={vm.openFilePicker} disabled={vm.isUploading} aria-busy={vm.isUploading}>
            <UploadIcon />
            {vm.isUploading ? t.uploading : t.upload}
          </Button>
        }
      />
      <input
        ref={vm.fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        aria-label={t.upload}
        onChange={vm.handleFileChange}
      />

      <div
        onDragOver={vm.onDragOver}
        onDragLeave={vm.onDragLeave}
        onDrop={vm.onDrop}
        className={cn(
          "text-muted-foreground flex items-center justify-center gap-1 rounded-md border border-dashed p-6 text-sm transition-colors",
          vm.dragging && "border-primary bg-accent text-foreground"
        )}
      >
        <span>{t.dropHint}</span>
        <button type="button" className="text-foreground underline" onClick={vm.openFilePicker}>
          {t.browse}
        </button>
      </div>

      <Input
        value={vm.search}
        onChange={(event) => vm.setSearch(event.target.value)}
        placeholder={t.search}
        aria-label={t.search}
        className="max-w-xs"
      />

      {vm.query.isPending ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="aspect-square w-full rounded-md" />
            </li>
          ))}
        </ul>
      ) : vm.query.isError ? (
        <div className="rounded-md border py-10 text-center">
          <p role="alert">{t.loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => vm.query.refetch()}>
            {TEXTS.common.retry}
          </Button>
        </div>
      ) : !list || list.getItems().length === 0 ? (
        <p className="text-muted-foreground rounded-md border py-10 text-center">{t.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {list.getItems().map((item) => (
            <li key={String(item.getId())}>
              <MediaCard
                item={item}
                onEdit={() => vm.openEdit(item)}
                onDelete={() => vm.askDelete(item)}
                onCopy={() => void vm.copyUrl(item)}
              />
            </li>
          ))}
        </ul>
      )}

      {paginate && paginate.getLastPage() > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!paginate.getHasPreviousPage()}
            onClick={() => vm.setPage(vm.page - 1)}
          >
            {t.previous}
          </Button>
          <span className="text-muted-foreground text-sm">
            {fill(t.pageOf, { page: paginate.getCurrentPage(), total: paginate.getLastPage() })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!paginate.getHasNextPage()}
            onClick={() => vm.setPage(vm.page + 1)}
          >
            {t.next}
          </Button>
        </div>
      ) : null}

      <MediaEditDialog media={vm.editing} onClose={vm.closeEdit} />

      <Dialog open={vm.deleting !== null} onOpenChange={(open) => !open && vm.cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {fill(t.deleteConfirmBody, { name: vm.deleting?.getName() ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={vm.cancelDelete}>
              {t.cancel}
            </Button>
            <Button variant="destructive" disabled={vm.isDeleting} onClick={vm.confirmDelete}>
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** One file: its thumbnail, name, size and dimensions, with the copy and actions controls. */
function MediaCard({
  item,
  onEdit,
  onDelete,
  onCopy,
}: {
  item: MediaAssetModel;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const width = item.getWidth();
  const height = item.getHeight();
  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-2">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-md">
        {item.isVideo() ? (
          <>
            <video
              src={item.getUrl()}
              preload="metadata"
              muted
              playsInline
              className="size-full object-cover"
            />
            <PlayIcon
              className="absolute start-2 top-2 size-4 text-white drop-shadow"
              aria-hidden
            />
          </>
        ) : (
          // Media lives on any host; next/image would need every origin listed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.getUrl()}
            alt={item.getAlt(DEFAULT_CONTENT_LOCALE)}
            loading="lazy"
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={item.getName()} dir="auto">
            {item.getName()}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {formatFileSize(item.getSize(), ADMIN_LOCALE)}
            {width && height ? ` · ${fill(t.dimensions, { width, height })}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label={t.copyUrl}
          onClick={onCopy}
        >
          <CopyIcon />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label={t.actions}>
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>{t.edit}</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              {t.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
