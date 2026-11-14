"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateMediaAssetSchema, type UpdateMediaAssetDto } from "@dtos";
import type { MediaAssetModel } from "@models";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@components";
import { useUpdateMediaAsset } from "@services";
import { CONTENT_LOCALES, CONTENT_LOCALE_LABELS } from "@/config/locale";
import { TEXTS, fill } from "@/texts";

const t = TEXTS.media;

/** Edits a file's display name and its alternative text per content locale. */
export function MediaEditDialog({
  media,
  onClose,
}: {
  /** The file being edited; `null` closes the dialog. */
  media: MediaAssetModel | null;
  onClose: () => void;
}) {
  const form = useForm<UpdateMediaAssetDto>({
    resolver: zodResolver(updateMediaAssetSchema),
    defaultValues: { name: "", alt: {} },
  });
  const update = useUpdateMediaAsset({
    onSuccess: () => {
      toast.success(t.updated);
      onClose();
    },
  });

  useEffect(() => {
    if (!media) return;
    form.reset({
      name: media.getName(),
      alt: Object.fromEntries(CONTENT_LOCALES.map((locale) => [locale, media.getAlt(locale)])),
    });
  }, [media, form]);

  return (
    <Dialog open={media !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.editTitle}</DialogTitle>
          <DialogDescription>{t.editDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (values) => media && update.mutate({ id: media.getId(), data: values })
            )}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.name}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {CONTENT_LOCALES.map((locale) => (
              <FormField
                key={locale}
                control={form.control}
                name={`alt.${locale}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {fill(t.altFor, { locale: CONTENT_LOCALE_LABELS[locale] })}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="auto" />
                    </FormControl>
                    <FormDescription>{t.altHint}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {t.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
