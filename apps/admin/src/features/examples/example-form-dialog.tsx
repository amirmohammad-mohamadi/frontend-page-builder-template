"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createExampleSchema, type CreateExampleDto } from "@dtos";
import type { ExampleModel } from "@models";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@components";
import { useCreateExample, useUpdateExample } from "@services";
import { TEXTS } from "@/texts";

const EMPTY: CreateExampleDto = { title: "", description: "", status: "draft" };

/** Create when `example` is null, edit otherwise. Closes itself on success. */
export function ExampleFormDialog({
  open,
  example,
  onClose,
}: {
  open: boolean;
  example: ExampleModel | null;
  onClose: () => void;
}) {
  const t = TEXTS.examples;
  const form = useForm<CreateExampleDto>({
    resolver: zodResolver(createExampleSchema),
    defaultValues: EMPTY,
  });
  const create = useCreateExample({
    onSuccess: () => {
      toast.success(t.created);
      onClose();
    },
  });
  const update = useUpdateExample({
    onSuccess: () => {
      toast.success(t.updated);
      onClose();
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      example
        ? {
            title: example.getTitle(),
            description: example.getDescription(),
            status: example.getStatus(),
          }
        : EMPTY
    );
  }, [open, example, form]);

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{example ? t.form.editTitle : t.form.createTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) =>
              example ? update.mutate({ id: example.getId(), data: values }) : create.mutate(values)
            )}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.form.title}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.form.description}</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.form.status}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(t.statuses) as Array<keyof typeof t.statuses>).map((status) => (
                        <SelectItem key={status} value={status}>
                          {t.statuses[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t.form.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {t.form.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
