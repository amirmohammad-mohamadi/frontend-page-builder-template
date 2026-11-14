"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components";
import { TEXTS, fill } from "@/texts";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  /** Whether unsaved changes are saved as part of publishing. */
  dirty: boolean;
  onConfirm: () => void;
  isPending: boolean;
};

/** Confirmation shown before the builder's Publish button saves and publishes the page. */
export function PublishConfirmDialog({
  open,
  onOpenChange,
  slug,
  dirty,
  onConfirm,
  isPending,
}: Props) {
  const t = TEXTS.builder;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.publishConfirmTitle}</DialogTitle>
          <DialogDescription>{fill(t.publishConfirmBody, { slug })}</DialogDescription>
        </DialogHeader>
        {dirty ? <p className="text-muted-foreground text-sm">{t.publishConfirmUnsaved}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? t.publishing : t.publishConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
