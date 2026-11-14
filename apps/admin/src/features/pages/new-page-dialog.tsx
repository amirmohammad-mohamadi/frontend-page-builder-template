"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createPageSchema, type CreatePageDto } from "@dtos";
import type { PageModel } from "@models";
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
import { useCreatePage } from "@services";
import { CONTENT_LOCALES, CONTENT_LOCALE_LABELS } from "@/config/locale";
import { TEXTS, fill } from "@/texts";

const t = TEXTS.pages.form;

/** The empty form: a slug and one title per content locale. */
const EMPTY: CreatePageDto = {
  slug: "",
  title: Object.fromEntries(CONTENT_LOCALES.map((locale) => [locale, ""])),
};

/** Creates a page (slug plus a title per content locale), then hands it to `onCreated`. */
export function NewPageDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (page: PageModel) => void;
}) {
  const form = useForm<CreatePageDto>({
    resolver: zodResolver(createPageSchema),
    defaultValues: EMPTY,
  });
  const create = useCreatePage({
    onSuccess: (page) => {
      toast.success(TEXTS.pages.created);
      onClose();
      onCreated(page);
    },
  });

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.slug}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus dir="ltr" className="font-mono" />
                  </FormControl>
                  <FormDescription>{t.slugHint}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {CONTENT_LOCALES.map((locale) => (
              <FormField
                key={locale}
                control={form.control}
                name={`title.${locale}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {fill(t.titleFor, { locale: CONTENT_LOCALE_LABELS[locale] })}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} dir="auto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {/* The whole-record rule ("a title in at least one language") lands on `title`. */}
            <FormField
              control={form.control}
              name="title"
              render={() => (
                <FormItem>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {t.create}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
