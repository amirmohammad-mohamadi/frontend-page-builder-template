"use client";

import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import {
  Badge,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components";
import { formatDateTime } from "@utils";
import { ADMIN_LOCALE, DEFAULT_CONTENT_LOCALE } from "@/config/locale";
import { PageHeader } from "@/components/page-header";
import { TEXTS, fill } from "@/texts";
import { NewPageDialog } from "./new-page-dialog";
import { usePagesTable, type PendingAction } from "./pages-table.hook";

const t = TEXTS.pages;

/** The confirmation copy of each row action. */
const CONFIRM: Record<
  PendingAction["kind"],
  { title: string; body: string; action: string; destructive: boolean }
> = {
  publish: {
    title: t.publishConfirmTitle,
    body: t.publishConfirmBody,
    action: t.publish,
    destructive: false,
  },
  unpublish: {
    title: t.unpublishConfirmTitle,
    body: t.unpublishConfirmBody,
    action: t.unpublish,
    destructive: true,
  },
  delete: {
    title: t.deleteConfirmTitle,
    body: t.deleteConfirmBody,
    action: t.delete,
    destructive: true,
  },
};

/** The pages list: title, slug, status and last update, with the create dialog and row actions. */
export function PagesTable() {
  const table = usePagesTable();
  const list = table.query.data;
  const paginate = list?.getPaginate();
  const confirm = table.pending ? CONFIRM[table.pending.kind] : null;

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button onClick={table.openCreate}>
            <PlusIcon />
            {t.newButton}
          </Button>
        }
      />

      <Input
        value={table.search}
        onChange={(event) => table.setSearch(event.target.value)}
        placeholder={t.search}
        aria-label={t.search}
        className="max-w-xs"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.columns.title}</TableHead>
              <TableHead>{t.columns.slug}</TableHead>
              <TableHead>{t.columns.status}</TableHead>
              <TableHead>{t.columns.updated}</TableHead>
              <TableHead className="w-12 text-end">
                <span className="sr-only">{t.columns.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.query.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.query.isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <p role="alert">{t.loadError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => table.query.refetch()}
                  >
                    {TEXTS.common.retry}
                  </Button>
                </TableCell>
              </TableRow>
            ) : !list || list.getItems().length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                  {t.empty}
                </TableCell>
              </TableRow>
            ) : (
              list.getItems().map((item) => {
                const published = item.isPublished();
                return (
                  <TableRow key={String(item.getId())}>
                    <TableCell className="font-medium" dir="auto">
                      {item.getTitle(DEFAULT_CONTENT_LOCALE) || t.untitled}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      /{item.getSlug()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={published ? "default" : "secondary"}>
                        {t.statuses[item.getStatus()]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(item.getUpdatedAt(), ADMIN_LOCALE)}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={t.columns.actions}>
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => table.openBuilder(item)}>
                            {t.openBuilder}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => table.openPreview(item)}>
                            {t.preview}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {published ? (
                            <DropdownMenuItem onSelect={() => table.ask("unpublish", item)}>
                              {t.unpublish}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => table.ask("publish", item)}>
                              {t.publish}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => table.ask("delete", item)}
                          >
                            {t.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {paginate && paginate.getLastPage() > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!paginate.getHasPreviousPage()}
            onClick={() => table.setPage(table.page - 1)}
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
            onClick={() => table.setPage(table.page + 1)}
          >
            {t.next}
          </Button>
        </div>
      ) : null}

      <NewPageDialog
        open={table.creating}
        onClose={table.closeCreate}
        onCreated={table.openBuilder}
      />

      <Dialog open={table.pending !== null} onOpenChange={(open) => !open && table.cancelPending()}>
        <DialogContent>
          {confirm && table.pending ? (
            <>
              <DialogHeader>
                <DialogTitle>{confirm.title}</DialogTitle>
                <DialogDescription>
                  {fill(confirm.body, { slug: table.pending.page.getSlug() })}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={table.cancelPending}>
                  {t.cancel}
                </Button>
                <Button
                  variant={confirm.destructive ? "destructive" : "default"}
                  disabled={table.isActing}
                  onClick={table.confirmPending}
                >
                  {confirm.action}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
