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
import { formatDate } from "@utils";
import { ADMIN_LOCALE } from "@/config/locale";
import { PageHeader } from "@/components/page-header";
import { TEXTS, fill } from "@/texts";
import { ExampleFormDialog } from "./example-form-dialog";
import { useExamplesTable } from "./examples-table.hook";

export function ExamplesTable() {
  const t = TEXTS.examples;
  const table = useExamplesTable();
  const list = table.query.data;
  const paginate = list?.getPaginate();

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
              <TableHead>{t.columns.status}</TableHead>
              <TableHead>{t.columns.created}</TableHead>
              <TableHead className="w-12 text-end">
                <span className="sr-only">{t.columns.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.query.isPending ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.query.isError ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center">
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
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  {t.empty}
                </TableCell>
              </TableRow>
            ) : (
              list.getItems().map((item) => (
                <TableRow key={String(item.getId())}>
                  <TableCell className="font-medium">{item.getTitle()}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive() ? "default" : "secondary"}>
                      {t.statuses[item.getStatus()]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.getCreatedAt(), ADMIN_LOCALE)}
                  </TableCell>
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={t.columns.actions}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => table.openEdit(item)}>
                          {t.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => table.askDelete(item)}
                        >
                          {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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

      <ExampleFormDialog
        open={table.editing !== null}
        example={table.editing === "new" ? null : table.editing}
        onClose={table.closeForm}
      />

      <Dialog open={table.deleting !== null} onOpenChange={(open) => !open && table.cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{t.deleteConfirmBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={table.cancelDelete}>
              {t.form.cancel}
            </Button>
            <Button variant="destructive" disabled={table.isDeleting} onClick={table.confirmDelete}>
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
